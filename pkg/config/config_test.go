package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestGetConfigPath(t *testing.T) {
	// Preserve original HOME and KUBECONFIG env vars
	originalHome := os.Getenv("HOME")
	defer os.Setenv("HOME", originalHome)

	// Create a temporary directory to act as HOME
	tempHome, err := os.MkdirTemp("", "testhome")
	if err != nil {
		t.Fatalf("failed to create temp HOME: %v", err)
	}
	os.Setenv("HOME", tempHome)

	// Helper to reset HOME for each subtest
	resetHome := func() {
		os.Setenv("HOME", tempHome)
	}

	tests := []struct {
		name        string
		input       string
		expect      string
		setupFunc   func()
		cleanupFunc func()
	}{
		{
			name:        "tilded path replaced",
			input:       "~/foo/bar.yaml",
			expect:      filepath.Join(tempHome, "foo/bar.yaml"),
			setupFunc:   func() {},
			cleanupFunc: func() {},
		},
		{
			name:        "non-empty explicit path",
			input:       "/etc/config.yaml",
			expect:      "/etc/config.yaml",
			setupFunc:   func() {},
			cleanupFunc: func() {},
		},
		{
			name:   "./config.yaml exists",
			input:  "",
			expect: "./config.yaml",
			setupFunc: func() {
				// create ./config.yaml in current dir (pkg/config)
				f, err := os.Create("config.yaml")
				if err != nil {
					t.Fatalf("failed to create config.yaml: %v", err)
				}
				f.Close()
			},
			cleanupFunc: func() {
				os.Remove("config.yaml")
			},
		},
		{
			name:   "default config exists",
			input:  "",
			expect: filepath.Join(tempHome, ".config/teleskopio/config.yaml"),
			setupFunc: func() {
				dir := filepath.Join(tempHome, ".config/teleskopio")
				//nolint
				os.MkdirAll(dir, 0o755)
				f, err := os.Create(filepath.Join(dir, "config.yaml"))
				if err != nil {
					t.Fatalf("failed to create default config: %v", err)
				}
				f.Close()
			},
			cleanupFunc: func() {
				os.RemoveAll(filepath.Join(tempHome, ".config"))
			},
		},
		{
			name:        "no file, empty input",
			input:       "",
			expect:      "",
			setupFunc:   func() {},
			cleanupFunc: func() {},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resetHome()
			// Clean up any previous files
			os.Remove("config.yaml")
			os.RemoveAll(filepath.Join(tempHome, ".config"))

			tt.setupFunc()
			defer tt.cleanupFunc()

			got := GetConfigPath(tt.input)
			if got != tt.expect {
				t.Fatalf("expected %q, got %q", tt.expect, got)
			}
		})
	}
}
