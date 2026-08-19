import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { registerDashboardBackgroundRefresh } from './src/background/task';
import { PRODUCTION_WEB_URL } from './src/config/production';
import { getDashboardSnapshot } from './src/data/dashboard';
import { classifyWebNavigation } from './src/web/navigation';
import { refreshHomeWidgets } from './src/widgets/register';

function LoadingView() {
  return (
    <View style={styles.centeredSurface}>
      <ActivityIndicator color="#3B82F6" size="large" />
    </View>
  );
}

function LoadErrorView({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.centeredSurface}>
      <Text accessibilityRole="header" style={styles.errorTitle}>
        Unable to load TrumpWatch
      </Text>
      <Text style={styles.errorMessage}>
        Check your connection and try again.
      </Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryLabel}>Retry</Text>
      </Pressable>
    </View>
  );
}

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);

  useEffect(() => {
    void registerDashboardBackgroundRefresh().catch((error) => {
      console.warn('[Widgets] Background refresh registration failed', error);
    });

    // The main activity renders the canonical production web product. This
    // separate native fetch exists only to keep home-screen widgets current.
    void getDashboardSnapshot()
      .then(refreshHomeWidgets)
      .catch((error) => {
        console.warn('[Widgets] Initial refresh failed', error);
      });
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  const handleNavigationRequest = useCallback((request: WebViewNavigation) => {
    const action = classifyWebNavigation(request.url, PRODUCTION_WEB_URL);
    if (action === 'allow') return true;

    if (action === 'external') {
      void Linking.openURL(request.url).catch((error) => {
        console.warn('[WebView] Unable to open external link', error);
      });
    }

    return false;
  }, []);

  const retry = useCallback(() => {
    setLoadFailed(false);
    setCanGoBack(false);
    setWebViewKey((current) => current + 1);
  }, []);

  return (
    <View style={styles.appSurface}>
      <StatusBar style="light" />
      {loadFailed ? (
        <LoadErrorView onRetry={retry} />
      ) : (
        <WebView
          key={webViewKey}
          ref={webViewRef}
          source={{ uri: PRODUCTION_WEB_URL }}
          style={styles.webView}
          containerStyle={styles.webViewContainer}
          originWhitelist={['http://*', 'https://*']}
          startInLoadingState
          renderLoading={LoadingView}
          onError={() => setLoadFailed(true)}
          onHttpError={(event) => {
            const failedUrl = event.nativeEvent.url.replace(/\/+$/, '');
            const productionUrl = PRODUCTION_WEB_URL.replace(/\/+$/, '');
            if (failedUrl === productionUrl && event.nativeEvent.statusCode >= 400) {
              setLoadFailed(true);
            }
          }}
          onNavigationStateChange={(navigation) => setCanGoBack(navigation.canGoBack)}
          onShouldStartLoadWithRequest={handleNavigationRequest}
          setSupportMultipleWindows={false}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          mixedContentMode="never"
          allowsBackForwardNavigationGestures
          allowsLinkPreview={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appSurface: {
    flex: 1,
    backgroundColor: '#020617',
    paddingTop: Constants.statusBarHeight,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  webView: {
    flex: 1,
    backgroundColor: '#020617',
  },
  centeredSurface: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    padding: 24,
  },
  errorTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
