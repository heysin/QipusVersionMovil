import React, { useContext, useState } from "react";
import {  DrawerContentScrollView,  DrawerItemList,  createDrawerNavigator,} from "@react-navigation/drawer";
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LoginContext } from "../context/loginContext";
import ComprobantesCompras from "./comprobantesCompras/comprobantesCompras";
import ComprobantesVentas from "./ComprobantesVentas/comprobantesVentas";
import ReporteConsolidado from "./reportes/reporteConsolidado";
import empresas from "./Empresas/empresas";
import monitorDeclaraciones from "./monitorDeclaraciones/monitorDeclaraciones";

const Drawer = createDrawerNavigator();

const confirmLogout = (logout: () => Promise<void>) => {
  Alert.alert("Cerrar sesión", "¿Deseas cerrar tu sesión?", [
    { text: "Cancelar", style: "cancel" },
    { text: "Cerrar sesión", style: "destructive", onPress: logout },
  ]);
};

const drawerTheme = {
  headerStyle: {
    backgroundColor: "#743484",
  },
  headerTintColor: "#FFFFFF",
  headerTitleStyle: {
    fontWeight: "700" as const,
  },
  drawerActiveTintColor: "#743484",
  drawerInactiveTintColor: "#4A5568",
  drawerStyle: {
    backgroundColor: "#F8F9FA",
  },
  drawerLabelStyle: {
    fontWeight: "600" as const,
  },
};

const CustomDrawerContent = (props: any) => {
  const { user, logout } = useContext(LoginContext);
  const userName =
    [user?.nombre, user?.apellidos].filter(Boolean).join(" ") || user?.dni || "Usuario";

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      {/* 1. Cuadro Morado con QIPUS Centrado */}
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerHeaderText}>QIPUS</Text>
      </View>

      {/* 2. Usuario Centrado fuera del cuadro morado */}
      <View style={styles.userOuterSection}>
        <Icon name="account-circle-outline" size={35} color="#743484" style={styles.userIcon} />
        <Text style={styles.userNameText} numberOfLines={1}>
          {userName}
        </Text>
      </View>

      {/* 3. Menús debajo de la línea divisoria */}
      <DrawerItemList {...props} />

      {/* 4. Footer Cerrar sesión */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity style={styles.drawerLogoutButton} onPress={() => confirmLogout(logout)}>
          <Text style={styles.drawerLogoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const UserHeader = () => {
  const { user, logout } = useContext(LoginContext);
  const [menuVisible, setMenuVisible] = useState(false);
  const userName = [user?.nombre, user?.apellidos].filter(Boolean).join(" ") || user?.dni || "Usuario";

  const handleLogout = () => {
    confirmLogout(logout);
  };

  return (
    <View style={styles.userHeader}>
      <TouchableOpacity
        style={styles.userMenuTrigger}
        onPress={() => setMenuVisible((visible) => !visible)}
        accessibilityRole="button"
        accessibilityLabel="Abrir menú de usuario"
      >
        <Icon name="account-circle-outline" size={22} color="#FFFFFF" style={styles.headerUserIcon} />
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>Bienvenido:</Text>
          <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
        </View>
      </TouchableOpacity>
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <TouchableOpacity style={styles.logoutButton} activeOpacity={1} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Salir</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const MenuPage = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Comprobante Compras"
      screenOptions={{
        ...drawerTheme,
        headerTitle: "QIPUS",
        headerRight: () => <UserHeader />,
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Empresas y declaraciones"
        component={empresas}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon name="office-building-outline" size={22} color={focused ? "#743484" : "#4A5568"} />
          ),
        }}
      />
      <Drawer.Screen
        name="Comprobante Compras"
        component={ComprobantesCompras}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon name="cart-outline" size={22} color={focused ? "#743484" : "#4A5568"} />
          ),
        }}
      />
      <Drawer.Screen
        name="Comprobante Ventas"
        component={ComprobantesVentas}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon name="file-document-outline" size={22} color={focused ? "#743484" : "#4A5568"} />
          ),
        }}
      />
       <Drawer.Screen
        name="Monitor de declaraciones"
        component={monitorDeclaraciones}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon name="gauge" size={22} color={focused ? "#743484" : "#4A5568"} />
          ),
        }}
      />
      <Drawer.Screen
        name="Reportes"
        component={ReporteConsolidado}
        options={{
          drawerIcon: ({ focused }) => (
            <Icon name="file-chart" size={22} color={focused ? "#743484" : "#4A5568"} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  // Cuadro morado con QIPUS centrado
  drawerHeader: {
    backgroundColor: "#743484",
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerHeaderText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },

  // Sección del usuario centrada horizontalmente
  userOuterSection: {
    flexDirection: "row",
    alignItems: "center",
    //justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginBottom: 8,
  },
  userIcon: {
    marginRight: 8,
  },
  userNameText: {
    color: "#2D3748",
    fontSize: 16,
    fontWeight: "700",
  },

  drawerContent: {
    flexGrow: 1,
  },
  drawerFooter: {
    marginTop: "auto",
    paddingTop: 16,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  drawerLogoutButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#743484",
    borderRadius: 6,
    paddingVertical: 10,
  },
  drawerLogoutText: {
    color: "#743484",
    fontSize: 14,
    fontWeight: "700",
  },

  // Header superior
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    maxWidth: 260,
    position: "relative",
  },
  userMenuTrigger: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerUserIcon: {
    fontSize: 22,
    marginRight: 6,
  },
  userInfo: {
    marginRight: 10,
    maxWidth: 135,
  },
  welcomeText: {
    color: "#E9D8FD",
    fontSize: 10,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 6,
    minWidth: 82,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  menuOverlay: {
    flex: 1,
    alignItems: "flex-end",
    paddingTop: 112,
    paddingRight: 10,
  },
  logoutButtonText: {
    color: "#743484",
    fontSize: 10,
    fontWeight: "700",
  },
});

export default MenuPage;