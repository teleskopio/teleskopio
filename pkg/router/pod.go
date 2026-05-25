package router

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"teleskopio/pkg/model"
	"time"

	"github.com/gin-gonic/gin"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (r *Route) GetPodLogs(c *gin.Context) {
	var req model.PodLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	podLogs, err := r.kapi.GetPodLogsReader(c.Request.Context(), req, &corev1.PodLogOptions{
		TailLines: req.TailLines,
		Container: req.Container,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	defer podLogs.Close()

	buf := new(bytes.Buffer)
	_, err = io.Copy(buf, podLogs)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	lines := []string{}
	for {
		line, err := buf.ReadString('\n')
		if err == io.EOF {
			break
		}
		lines = append(lines, line)
	}
	c.JSON(http.StatusOK, lines)
}

func (r *Route) StreamPodLogs(c *gin.Context) {
	var req model.PodLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}
	timeNow := metav1.NewTime(time.Now())
	podLogOptions := &corev1.PodLogOptions{
		Follow:    true,
		Container: req.Container,
	}
	podLogOptions.SinceTime = &timeNow
	podLogs, err := r.kapi.GetPodLogsReader(c.Request.Context(), req, podLogOptions)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	// TODO might be a collision with another server
	podLogsKey := fmt.Sprintf("pod_log_line_%s_%s", req.Name, req.Namespace)
	if _, ok := r.podLogsWatchers[podLogsKey]; ok {
		c.JSON(http.StatusOK, gin.H{"success": ""})
		return
	}
	r.podLogsWatchers[podLogsKey] = make(chan bool)
	stopAndClean := func() {
		slog.Debug("stop pod logs stream", "pod", podLogsKey)
		podlogsChan := r.podLogsWatchers[podLogsKey]
		close(podlogsChan)
		delete(r.podLogsWatchers, podLogsKey)
		podLogs.Close()
	}
	cancel := func() bool {
		select {
		case <-r.podLogsWatchers[podLogsKey]:
			return true
		default:
			return false
		}
	}
	go func() {
		defer stopAndClean()
		for cancel() {
			buf := make([]byte, 2000)
			numBytes, err := podLogs.Read(buf)
			if err == io.EOF {
				break
			}
			if numBytes == 0 {
				time.Sleep(time.Second)
				continue
			}
			if err != nil {
				break
			}
			message := string(buf[:numBytes])
			slog.Debug("log line", "line", message, "pod", podLogsKey)
			payload, _ := json.Marshal(map[string]interface{}{
				"event": podLogsKey,
				"payload": map[string]interface{}{
					"container": req.Container,
					"pod":       req.Name,
					"namespace": req.Namespace,
					"line":      message,
				},
			})
			r.hub.Broadcast(payload)
		}
	}()

	c.JSON(http.StatusOK, gin.H{"success": ""})
}

func (r *Route) StopStreamPodLogs(c *gin.Context) {
	var req model.PodLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		slog.Error("parsing", "err", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	podLogsKey := fmt.Sprintf("pod_log_line_%s_%s", req.Name, req.Namespace)

	r.podLogsWatchers[podLogsKey] <- true

	c.JSON(http.StatusOK, gin.H{"success": ""})
}
