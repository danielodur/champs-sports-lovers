import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Button,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";

interface OAuthWebViewProps {
  visible: boolean;
  url: string;
  onClose: () => void;
  onSuccess: (url: string) => void;
  onError: (error: string) => void;
}

export default function OAuthWebView({
  visible,
  url,
  onClose,
  onSuccess,
  onError,
}: OAuthWebViewProps) {
  console.log("🔐 OAuthWebView props:", { visible, url });

  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add useEffect to track prop changes and handle timeouts
  useEffect(() => {
    console.log("🔐 OAuthWebView useEffect - props changed:", { visible, url });

    // Clear any existing timeout when props change
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set a timeout for OAuth completion (Facebook-style fallback)
    if (visible && url) {
      timeoutRef.current = setTimeout(() => {
        console.log("⚠️ OAuth timeout reached, checking auth state...");
        // Don't automatically close, let the user decide
      }, 60000); // 60 seconds timeout
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [visible, url]);

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setLoading(navState.loading);

    console.log("🔐 Navigation state changed:", navState.url);

    // Facebook-style: More robust callback detection
    // Check if this is a callback URL (Supabase OAuth callback)
    if (navState.url.includes("supabase.co/auth/v1/callback")) {
      console.log("✅ Supabase OAuth callback detected:", navState.url);

      // Check if the callback contains success parameters
      if (
        navState.url.includes("access_token=") ||
        navState.url.includes("session=")
      ) {
        console.log("✅ Valid OAuth callback with tokens detected");

        // Clear timeout on successful callback
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        onSuccess(navState.url);
        return;
      } else if (navState.url.includes("error=")) {
        console.error("❌ OAuth error in callback:", navState.url);
        const errorMatch = navState.url.match(/error_description=([^&]+)/);
        const errorMessage = errorMatch
          ? decodeURIComponent(errorMatch[1])
          : "OAuth authentication failed";
        onError(errorMessage);
        return;
      }
    }

    // Check for custom scheme callback (fallback)
    if (navState.url.startsWith("champs://auth/callback")) {
      console.log("✅ Custom scheme OAuth callback detected:", navState.url);

      // Check if this is an error callback
      if (navState.url.includes("error=")) {
        console.error(
          "❌ OAuth error in custom scheme callback:",
          navState.url
        );
        const errorMatch = navState.url.match(/error_description=([^&#]+)/);
        const errorMessage = errorMatch
          ? decodeURIComponent(errorMatch[1].replace(/\+/g, " "))
          : "OAuth authentication failed";
        onError(errorMessage);
        return;
      }

      onSuccess(navState.url);
      return;
    }

    // Check for error URLs in any format
    if (navState.url.includes("error=")) {
      console.error("❌ OAuth error detected:", navState.url);
      const errorMatch = navState.url.match(/error_description=([^&]+)/);
      const errorMessage = errorMatch
        ? decodeURIComponent(errorMatch[1])
        : "OAuth error occurred";
      onError(errorMessage);
      return;
    }
  };

  const handleLoadStart = () => {
    setLoading(true);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error("❌ WebView error:", nativeEvent);

    // Clear timeout on error
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    onError("Failed to load OAuth page");
  };

  const handleGoBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      // Clear timeout when closing
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      onClose();
    }
  };

  console.log("🔐 OAuthWebView rendering Modal with visible:", visible);
  console.log(
    "🔐 OAuthWebView about to render Modal, visible:",
    visible,
    "url:",
    url
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => {
        console.log("🔐 Modal onRequestClose triggered");

        // Clear timeout when modal is closed
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        onClose();
      }}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons
              name={canGoBack ? "arrow-back" : "close"}
              size={24}
              color="#007AFF"
            />
          </TouchableOpacity>
          <Text style={styles.title}>Sign In</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* WebView */}
        {url ? (
          <WebView
            ref={webViewRef}
            source={{ uri: url }}
            style={styles.webview}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsBackForwardNavigationGestures={true}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
          />
        ) : (
          <View style={styles.noUrlContainer}>
            <Text style={styles.noUrlText}>No URL provided</Text>
            <Text style={styles.noUrlSubtext}>
              Check console logs for debugging info
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  placeholder: {
    width: 40,
  },

  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
  },
  noUrlContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noUrlText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  noUrlSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});
