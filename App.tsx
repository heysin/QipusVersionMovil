import React, { useState, useContext } from 'react';
import LoginPage from './src/pages/login/loginPage';
import { DarkTheme, DefaultTheme, ThemeProvider,} from "@react-navigation/native";
import { LoginContext } from './src/context/loginContext';
import ComprobantesCompras from './src/pages/comprobantesCompras/comprobantesCompras';
import { useColorScheme } from "./src/components/useColorScheme";
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {  createDrawerNavigator,  createDrawerScreen,} from '@react-navigation/drawer';
import MenuPage from './src/pages/MenuPage';
import 'react-native-gesture-handler';
const App = () => {
  const { isLoggedIn } = useContext(LoginContext);
  const colorScheme = useColorScheme();

  return (
    <NavigationContainer>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        {isLoggedIn ? <MenuPage /> : <LoginPage />}
      </ThemeProvider>
    </NavigationContainer>
  );
};
const styles = StyleSheet.create({
  container: {
    width: "80%",
    alignSelf: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    elevation: 5, // sombra en Android
    shadowColor: "#000", // sombra en iOS
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  success: { borderLeftWidth: 6, borderLeftColor: "green" },
  error: { borderLeftWidth: 6, borderLeftColor: "red" },
  title: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  text: { fontSize: 14, textAlign: "center", marginTop: 5 },
});
export default App;
