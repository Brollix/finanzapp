import Constants from 'expo-constants';

/**
 * Build a base URL pointing to the host running Metro/Expo, but different port.
 * Works for dev environments where the phone accesses the PC over Wi-Fi.
 *
 * Example: if hostUri is "192.168.0.123:19000" and port=8080 → returns "http://192.168.0.123:8080".
 */
export const getBackendUrl = (port: number, path: string = ''): string => {
  // SDK 49+: hostUri lives in expoConfig, older versions use manifest.debuggerHost
  // Fallback to localhost when not available (web).
  // hostUri example: "192.168.0.123:19000"
  const hostUri: string | undefined =
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants.manifest as any)?.debuggerHost ||
    'localhost:19000';

  const ip = hostUri.split(':')[0];
  return `http://${ip}:${port}${path}`;
};

/**
 * Use envUrl if it is set AND doesn't point to localhost/10.0.2.2. Otherwise build dynamic.
 */
export const resolveBackendUrl = (
  envUrl: string | undefined,
  port: number,
  path: string = ''
): string => {
  if (envUrl && !/localhost|127\.0\.0\.1|10\.0\.2\.2/i.test(envUrl)) {
    return envUrl.endsWith(path) || !path ? envUrl : `${envUrl.replace(/\/$/, '')}${path}`;
  }
  return getBackendUrl(port, path);

};
