import { getLocalKeyObject } from '@/lib/localStorage';

export async function stopLogsWatcher(name: string, namespace: string, container: string) {
  const config = getLocalKeyObject('currentCluster');
  const server = config.server;
  if (config.hasOwnProperty('server')) {
    return;
  }
  const token = localStorage.getItem('token');
  await fetch(`/api/stop_pod_log_stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? token : '',
    },
    body: JSON.stringify({ server, name, namespace, container }),
  });
}
