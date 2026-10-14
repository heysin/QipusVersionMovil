import React, { useState ,useContext} from 'react';
import {  Text,  StyleSheet,  View,  TextInput,  ScrollView,  TouchableOpacity,  SafeAreaView,  ActivityIndicator,} from 'react-native';
import authService from '../../servicios/auth/login';
import { LoginUsuarioRequest } from '../../models/auth';
import { LoginContext } from '../../context/loginContext';
import { handleError } from '../../components/error-handler';
import PoliticasSeguridadModal from '../../modales/PoliticasSeguridadModal';

const LoginPage = () => {
  const [dni, setDni] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dniError, setDniError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [securityPoliciesVisible, setSecurityPoliciesVisible] = useState(false);
  const { setIsLoggedIn, setHasEnterprise, setUser } = useContext(LoginContext);

  const validateFields = () => {
    const nextDniError = dni.trim() ? null : 'El DNI es obligatorio.';
    const nextPasswordError = password.trim() ? null : 'La contraseña es obligatoria.';

    setDniError(nextDniError);
    setPasswordError(nextPasswordError);

    return !nextDniError && !nextPasswordError;
  };

  const handleLogin = async () => {
    const isValid = validateFields();

    if (!isValid) {
      setError('Completa los campos obligatorios.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const filters: LoginUsuarioRequest = {
        dni: dni,
        password: password,
      };
      const response = await authService.login(filters);
      if (response?.data?.isSuccess) {
        setUser(response?.data?.usuario ?? response?.usuario ?? null);
        setHasEnterprise(response?.data?.hasEnterprise === true);
        setIsLoggedIn(true);
      } else {
       setError('Credenciales incorrectas.');
      }
    } catch (err: any) {
      const message = handleError(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera / Logo */}
        <View style={styles.headerContainer}>
          <Text style={styles.logoText}>QIPUS</Text>
          <Text style={styles.sloganText}>
            Trabajamos para que tu contabilidad sea más simple
          </Text>
        </View>

        {/* Título de la acción */}
        <Text style={styles.titleText}>Iniciar Sesión</Text>

        {/* Formulario */}
        <View style={styles.formContainer}>
          {/* Campo DNI */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              DNI: <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={dni}
              placeholder="Ejemplo: 41417341"
              onChangeText={(value) => {
                setDni(value);
                if (dniError) setDniError(null);
                if (error) setError(null);
              }}
              keyboardType="numeric"
            />
            {dniError ? <Text style={styles.fieldError}>{dniError}</Text> : null}
          </View>

          {/* Campo Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Contraseña: <Text style={styles.required}>*</Text>
            </Text>
            {/* Corregido: Cambiado <div> por <View> */}
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { paddingRight: 40 }]}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (passwordError) setPasswordError(null);
                  if (error) setError(null);
                }}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="visible-password"
                textContentType="password"
                importantForAutofill="yes"
              />
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
              {/* Icono de ojo */}
              <TouchableOpacity style={styles.eyeIcon}>
                <Text style={{ fontSize: 18, color: '#8e8e93' }}>👁️</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recuperar Contraseña */}
          <TouchableOpacity style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>
              ¿No recuerdas la contraseña?
            </Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Botón Iniciar Sesión */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {/* Registro */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿Eres nuevo en QIPUS? </Text>
            <TouchableOpacity>
              <Text style={styles.registerLink}>Crear una cuenta</Text>
            </TouchableOpacity>
          </View>

          {/* Políticas de Seguridad */}
          <TouchableOpacity
            style={styles.securityContainer}
            onPress={() => setSecurityPoliciesVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir políticas de seguridad"
          >
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.securityText}>Políticas de seguridad.</Text>
          </TouchableOpacity>
        </View>

        {/* Separador */}
        <View style={styles.divider} />

        {/* Footer Culqi */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            <Text style={styles.culqiBrand}>Q Culqi</Text> | Pagos 100% seguros
            y confiables
          </Text>
        </View>
      </ScrollView>
      <PoliticasSeguridadModal
        visible={securityPoliciesVisible}
        onClose={() => setSecurityPoliciesVisible(false)}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    paddingHorizontal: 30,
    paddingVertical: 40,
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#743484',
    letterSpacing: 1,
  },
  sloganText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d2d2d',
    marginTop: 8,
    textAlign: 'center',
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 30,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 6,
  },
  required: {
    color: '#cc0000',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#eef3fc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#dbe3f0',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 12,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  forgotPasswordText: {
    color: '#92549c',
    fontSize: 15,
    fontWeight: '500',
  },
  loginButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#311847',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#cc0000',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  fieldError: {
    color: '#cc0000',
    fontSize: 12,
    marginTop: 6,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  registerText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: 'bold',
  },
  registerLink: {
    fontSize: 15,
    color: '#92549c',
    fontWeight: '500',
  },
  securityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  lockIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  securityText: {
    fontSize: 14,
    color: '#333333',
    textDecorationLine: 'underline',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#e0e0e0',
    // Corregido: Eliminado verticalMargin que no existe en React Native
    marginTop: 40,
    marginBottom: 20,
  },
  footerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  footerText: {
    fontSize: 13,
    color: '#444444',
  },
  culqiBrand: {
    fontWeight: 'bold',
    color: '#ff6600',
  },
});

export default LoginPage;
