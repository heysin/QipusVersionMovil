import React, { createContext } from "react";
import { Alert, AppState, StyleSheet, View } from "react-native";
import { UsuarioResponse } from "../models/user";
import { clearToken } from "../utils/storage";

const INACTIVITY_TIMEOUT_MS = 50 * 60 * 1000;//5 * 60 * 1000;

export const LoginContext = createContext({
  isLoggedIn: false,
  setIsLoggedIn: (_value: boolean) => {},
  hasEnterprise: false,
  setHasEnterprise: (_value: boolean) => {},
  user: null as UsuarioResponse | null,
  setUser: (_value: UsuarioResponse | null) => {},
  registerActivity: () => {},
  logout: async () => {},
});

const LoginProvider = (props: any) => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [hasEnterprise, setHasEnterprise] = React.useState(false);
  const [user, setUser] = React.useState<UsuarioResponse | null>(null);
  const lastActivityAt = React.useRef(Date.now());
  const inactivityTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = React.useCallback(async () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    await clearToken();
    setUser(null);
    setHasEnterprise(false);
    setIsLoggedIn(false);
  }, []);

  const expireSession = React.useCallback(async () => {
    await logout();
    Alert.alert(
      "Sesión cerrada",
      "Tu sesión se cerró por inactividad.",
    );
  }, [logout]);

  const scheduleInactivityLogout = React.useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }

    if (!isLoggedIn || AppState.currentState !== "active") return;

    const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivityAt.current);
    if (remaining <= 0) {
      expireSession();
      return;
    }

    inactivityTimer.current = setTimeout(() => {
      expireSession();
    }, remaining);
  }, [isLoggedIn, expireSession]);

  const registerActivity = React.useCallback(() => {
    if (!isLoggedIn) return;
    lastActivityAt.current = Date.now();
    scheduleInactivityLogout();
  }, [isLoggedIn, scheduleInactivityLogout]);

  React.useEffect(() => {
    if (!isLoggedIn) {
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
      return;
    }

    lastActivityAt.current = Date.now();
    scheduleInactivityLogout();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        scheduleInactivityLogout();
      } else if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    });

    return () => {
      subscription.remove();
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    };
  }, [isLoggedIn, scheduleInactivityLogout]);

  return (
    <LoginContext.Provider value={{ isLoggedIn, setIsLoggedIn, hasEnterprise, setHasEnterprise, user, setUser, registerActivity, logout }}>
      <View style={styles.container} onTouchStart={registerActivity}>
        {props.children}
      </View>
    </LoginContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default LoginProvider;