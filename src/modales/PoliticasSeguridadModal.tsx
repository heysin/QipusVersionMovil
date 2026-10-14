import React from 'react';
import {  Modal,  SafeAreaView,  ScrollView,  StyleSheet,  Text,  TouchableOpacity,  View,} from 'react-native';

type PoliticasSeguridadModalProps = {
  visible: boolean;
  onClose: () => void;
};

const securityPolicySections = [
  {
    title: '1. Autenticación y Autorización',
    points: [
      'Contraseñas seguras: Se requiere una contraseña de al menos 8 caracteres, con una combinación de letras, números y símbolos.',
    ],
  },
  {
    title: '2. Protección de Datos del Usuario',
    points: [
      'Encriptación de datos: Todos los datos se transfieren a través de HTTPS y se almacenan encriptados en la base de datos para garantizar su privacidad.',
      'Respeto a la privacidad: No se recolectan datos contables ni personales en este proceso. Toda la información es tratada de forma anónima y segura, en cumplimiento con la Ley N.º 29733 – Ley de Protección de Datos Personales y su reglamento en el Perú.',
    ],
  },
  {
    title: '3. Uso de Credenciales de SUNAT',
    points: [
      'Requerimiento de credenciales: QIPUS utiliza el ID y la Clave de la API de SUNAT de cada empresa registrada en la plataforma con el único fin de habilitar la conexión con la API de SUNAT.',
      'Finalidad exclusiva: Estas credenciales se utilizan únicamente para obtener comprobantes electrónicos y declaraciones tributarias del usuario.',
      'Confidencialidad garantizada: QIPUS asegura que las credenciales no serán empleadas con otros fines, ni generarán beneficios para terceros, y estarán protegidas bajo estrictos estándares de seguridad y confidencialidad.',
    ],
  },
  {
    title: '4. Auditoría de Accesos',
    points: [
      'Acceso restringido a la información: Registramos todas las acciones dentro de la plataforma para mantener un control detallado de las modificaciones y accesos a los datos.',
    ],
  },
  {
    title: '5. Integridad de la Información',
    points: [
      'Prevención de vulnerabilidades: Se realiza una validación exhaustiva de las entradas de datos para prevenir ataques como SQL Injection o Cross-Site Scripting (XSS).',
      'Respaldo de datos: Todos los datos se respaldan automáticamente de manera periódica para prevenir pérdidas de información.',
    ],
  },
  {
    title: '6. Actualizaciones y Mantenimiento',
    points: [
      'Mantenimiento de sistema: Mantenemos actualizadas todas las dependencias y librerías del sistema para prevenir vulnerabilidades conocidas.',
      'Pruebas de seguridad: Se realizan pruebas automáticas para detectar vulnerabilidades en el sistema antes de cada lanzamiento.',
    ],
  },
  {
    title: '7. Seguridad Física y de Infraestructura',
    points: [
      'Proveedor cloud certificado: Utilizamos plataformas en la nube de alto nivel que cumplen con normativas internacionales de seguridad.',
    ],
  },
  {
    title: '8. Capacitación y Concientización',
    points: [
      'Entrenamiento continuo: El equipo de QIPUS recibe capacitación periódica sobre prácticas de seguridad para mantener altos estándares de protección.',
      'Procedimiento ante incidentes: Los usuarios y el equipo de soporte están capacitados para manejar cualquier posible incidente de seguridad de forma eficiente.',
    ],
  },
  {
    title: '9. Mejora Continua de la Plataforma',
    points: [
      'Análisis de navegación: QIPUS realiza una revisión general de los patrones de uso dentro de la plataforma, incluyendo secciones más visitadas, tiempo de permanencia y acciones más frecuentes.',
      'Optimización de la experiencia: La información recopilada se emplea de manera exclusiva para identificar oportunidades de mejora en el diseño, la velocidad y la funcionalidad de la plataforma, con el propósito de optimizar la experiencia de los usuarios en sus procesos contables y tributarios.',
      'Uso responsable de los datos: QIPUS garantiza que la información de navegación no será utilizada para fines distintos a la mejora continua de la plataforma, asegurando así la protección, confidencialidad y confianza de todos nuestros usuarios.',
    ],
  },
];

const PoliticasSeguridadModal = ({ visible, onClose }: PoliticasSeguridadModalProps) => (
  <Modal visible={visible}  transparent  animationType="slide"  onRequestClose={onClose} >
    <View style={styles.overlay}>
      <SafeAreaView style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Políticas de Seguridad</Text>
          <TouchableOpacity
            onPress={onClose}   accessibilityRole="button"  accessibilityLabel="Cerrar políticas de seguridad"
            style={styles.closeButton} >
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator >
          <Text style={styles.intro}>
            Bienvenido a la sección de Políticas de Seguridad de QIPUS. Esta guía detalla
            las mejores prácticas y normativas para garantizar la protección y privacidad
            de los datos de nuestros usuarios. A continuación, se presentan las principales
            directrices de seguridad de la plataforma.
          </Text>
          {securityPolicySections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.points.map((point) => (
                <Text key={point} style={styles.point}>
                  {'\u2022  '}{point}
                </Text>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    flex: 1,
    marginRight: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#311847',
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  closeText: {
    color: '#743484',
    fontSize: 14,
    fontWeight: '600',
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  intro: {
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 21,
    color: '#333333',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 7,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: 'bold',
    color: '#311847',
  },
  point: {
    marginBottom: 7,
    fontSize: 14,
    lineHeight: 21,
    color: '#333333',
  },
});

export default PoliticasSeguridadModal;
