import { ActivityIndicator, Alert, StyleSheet, Dimensions, View, Text, TextInput, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocalSearchParams } from "expo-router";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import enterpriseService from "../../servicios/empresas/empresa";
import { enterpiseSchema } from "../../forms/enterpriseSchema";
import { DeclaracionDTO, SaveEnterpriseRequest, SunatConnectionRequest, UpdateEnterpriseRequest } from "../../models/enterprise";

type ModeState = "add" | "edit" | "view";

type RHFField = {
  onChange: (value: any) => void;
  value: any;
};

const sunatSchema = z.object({
  usuarioSunat: z.string().min(1, { message: "El Usuario SUNAT es obligatorio" }),
  claveSunat: z.string().min(1, { message: "La Clave SUNAT es obligatoria" }),
  ruc: z
    .string()
    .min(1, { message: "El RUC es obligatorio" })
    .regex(/^\d{10,11}$/, { message: "El RUC debe tener 10 o 11 dígitos" }),
});

type SunatSchema = z.infer<typeof sunatSchema>;

interface EnterpriseFormProps {
  handleValidateAccess: ({ access }: { access: SunatConnectionRequest }) => Promise<void>;
  razonSocial: string;
  visibleMensaje: boolean;
  isValidConnection: boolean;
  enterpriseDefaultValues: Partial<z.infer<typeof enterpiseSchema>>;
  sunatDefaulValues?: SunatSchema;
  mode?: ModeState;
  idEmpresa?: string;
}

const { width: initialWidth } = Dimensions.get("window");

const FieldLabel = ({ label }: { label: string }) => <Text style={styles.fieldLabel}>{label}</Text>;

const FieldInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType = "default",
  secureTextEntry = false,
  maxLength,
  styleContainer,
  error,
}: {
  label: string;
  value?: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: "default" | "numeric" | "email-address";
  secureTextEntry?: boolean;
  maxLength?: number;
  styleContainer?: object;
  error?: string;
}) => (
  <View style={styleContainer}>
    <FieldLabel label={label} />
    <TextInput
      value={value ?? ""}
      onChangeText={onChangeText}
      placeholder={placeholder}
      editable={editable}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      maxLength={maxLength}
      style={[styles.input, !editable && styles.inputDisabled]}
      placeholderTextColor="#8a8a8a"
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const CheckboxGroup = ({
  options,
  value = [],
  onChange,
  disabled = false,
}: {
  options: Array<{ label: string; value: string }>;
  value?: string[];
  onChange?: (value: string[]) => void;
  disabled?: boolean;
}) => (
  <View style={styles.checkboxGroup}>
    {options.map((option) => {
      const isChecked = value.includes(option.value);
      return (
        <Pressable
          key={option.value}
          disabled={disabled}
          onPress={() => {
            if (!onChange) return;
            const nextValue = isChecked
              ? value.filter((item) => item !== option.value)
              : [...value, option.value];
            onChange(nextValue);
          }}
          style={styles.checkboxRow}
        >
          <View
            style={[
              styles.checkboxBox,
              isChecked && styles.checkboxBoxChecked,
              disabled && styles.checkboxBoxDisabled,
            ]}
          >
            {isChecked ? <MaterialCommunityIcons name="check" size={14} color="#fff" /> : null}
          </View>
          <Text style={[styles.checkboxLabel, disabled && styles.checkboxLabelDisabled]}>{option.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

type EmpresaFormMode = "add" | "edit" | "view";

const createEmptyEnterprise = () => ({
  idEmpresa: "",
  ruc: "",
  razonSocial: "",
  usuarioSunat: "",
  claveSunat: "",
  email: "",
  PrimeraNotificacionVencimiento: 1,
  SegundaNotificacionVencimiento: 2,
  DiaDespuesVencimiento: 3,
  declaraciones: [] as string[],
  ClientId: "",
  ClientSecret: "",
});

const getEnterpriseValue = (enterprise: any, keys: string[]) => {
  const normalizedKeys = new Set(keys.map((key) => key.toLowerCase().replace(/[^a-z0-9]/g, "")));
  const match = Object.entries(enterprise ?? {}).find(([key, value]) => {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    return normalizedKeys.has(normalizedKey) && value !== null && value !== undefined && String(value).trim() !== "";
  });

  return match?.[1];
};

const mapDeclarations = (declarations: unknown): string[] => {
  if (!Array.isArray(declarations)) return [];

  const selectedCodes = declarations.reduce<string[]>((selected, declaration) => {
    if (declaration === null || declaration === undefined) return selected;

    if (typeof declaration === "object") {
      const record = declaration as Record<string, unknown>;
      const active = record.activo ?? record.active ?? record.isActive;
      if (active === false || active === 0 || String(active).toLowerCase() === "false") return selected;
    }

    const rawCode = typeof declaration === "object"
      ? getEnterpriseValue(declaration, ["idFormulario", "codigoFormulario", "codigo", "formularioId", "value"])
      : declaration;
    const code = String(rawCode ?? "");

    if (["601", "621"].includes(code) && !selected.includes(code)) {
      selected.push(code);
    }

    return selected;
  }, []);

  return selectedCodes;
};

const mapEnterpriseToFormData = (enterprise: any) => ({
  ...(() => {
    const declarationRows = getEnterpriseValue(enterprise, ["declaraciones"]) ?? [];
    return {
      ...createEmptyEnterprise(),
      ...enterprise,
      idEmpresa: String(getEnterpriseValue(enterprise, ["idEmpresa", "id"]) ?? ""),
      ruc: String(getEnterpriseValue(enterprise, ["ruc", "RUC"]) ?? ""),
      razonSocial: String(getEnterpriseValue(enterprise, ["razonSocial", "RazonSocial", "razon_social"]) ?? ""),
      usuarioSunat: String(getEnterpriseValue(enterprise, ["usuarioSunat", "UsuarioSunat", "usuario_sunat"]) ?? ""),
      claveSunat: String(getEnterpriseValue(enterprise, ["claveSunat", "ClaveSunat", "clave_sunat"]) ?? ""),
      email: String(getEnterpriseValue(enterprise, ["email", "Email", "correo"]) ?? ""),
      ClientId: String(getEnterpriseValue(enterprise, ["ClientId", "clientId", "ClienteId"]) ?? ""),
      ClientSecret: String(getEnterpriseValue(enterprise, ["ClientSecret", "clientSecret"]) ?? ""),
      declaracionesOriginales: Array.isArray(declarationRows) ? declarationRows : [],
      declaraciones: mapDeclarations(declarationRows),
    };
  })(),
});

interface EmpresaFormProps {
  idEmpresa?: string;
  mode: EmpresaFormMode;
  onSaved: () => Promise<void>;
}

export function EmpresaForm({ idEmpresa, mode, onSaved }: EmpresaFormProps) {
  const [data, setData] = useState<Record<string, any>>(createEmptyEnterprise);
  const [isLoadingDetails, setIsLoadingDetails] = useState(mode !== "add");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isValidConnection, setIsValidConnection] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isReadOnly = mode === "view";

  useEffect(() => {
    let isActive = true;

    setIsValidConnection(false);
    setLoadError(null);

    if (mode === "add") {
      setData(createEmptyEnterprise());
      setIsLoadingDetails(false);
      return () => {
        isActive = false;
      };
    }

    if (!idEmpresa) {
      setLoadError("No se recibió el identificador de la empresa.");
      setIsLoadingDetails(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoadingDetails(true);
    enterpriseService.getEmpresaById({ idEmpresa })
      .then((response) => {
        const enterprise = response?.data?.empresa ?? response?.data ?? response?.empresa ?? response;
        if (!enterprise || typeof enterprise !== "object") {
          throw new Error("La respuesta no contiene el detalle de la empresa.");
        }
        if (isActive) setData(mapEnterpriseToFormData(enterprise));
      })
      .catch((error: any) => {
        if (isActive) {
          const message = error?.message || "No se pudo cargar el detalle de la empresa.";
          setLoadError(message);
          Alert.alert("Error", message);
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingDetails(false);
      });

    return () => {
      isActive = false;
    };
  }, [idEmpresa, mode]);

  const handleFieldChange = (field: string, value: unknown) => {
    setData((current) => ({ ...current, [field]: value }));
    if (["ruc", "usuarioSunat", "claveSunat"].includes(field)) {
      setIsValidConnection(false);
    }
  };

  const handleValidateSunat = async () => {
    const access: SunatConnectionRequest = {
      ruc: String(data.ruc ?? "").trim(),
      usuarioSunat: String(data.usuarioSunat ?? "").trim(),
      claveSunat: String(data.claveSunat ?? "").trim(),
    };

    if (!access.ruc || !access.usuarioSunat || !access.claveSunat) {
      Alert.alert("Validación", "Completa el RUC, el usuario SUNAT y la clave SUNAT.");
      return;
    }

    if (!/^\d{11}$/.test(access.ruc)) {
      Alert.alert("Validación", "El RUC debe contener 11 dígitos.");
      return;
    }

    try {
      setIsValidating(true);
      const response = await enterpriseService.validateSunatAccess({ access });
      const isValid = response?.isValidConnection ?? response?.isValid ?? response?.valid ?? response?.success ?? true;
      setIsValidConnection(Boolean(isValid));

      if (!isValid) {
        Alert.alert("Validación SUNAT", response?.message ?? response?.mensaje ?? "No se pudo validar el acceso.");
        return;
      }

      const validationData = response?.data ?? response;
      const razonSocial = getEnterpriseValue(validationData, ["razonSocial", "RazonSocial", "razon_social"]);
      if (razonSocial) {
        setData((current) => ({ ...current, razonSocial: String(razonSocial) }));
      }

      const message = typeof response === "string" ? response : response?.message ?? response?.mensaje;
      Alert.alert("Validación SUNAT", message || "Acceso validado correctamente.");
    } catch (error: any) {
      setIsValidConnection(false);
      const responseData = error?.response?.data;
      const message =
        (typeof responseData === "string" ? responseData : responseData?.message) ??
        error?.message ??
        "No se pudo validar el acceso a SUNAT.";
      Alert.alert("Error de conexión", message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveEnterprise = async () => {
    if (!isValidConnection) {
      Alert.alert("Validación", "Valida primero el acceso a SUNAT.");
      return;
    }

    const enterpriseBase = {
      usuarioSunat: String(data.usuarioSunat ?? "").trim(),
      claveSunat: String(data.claveSunat ?? "").trim(),
      ruc: String(data.ruc ?? "").trim(),
      razonSocial: String(data.razonSocial ?? "").trim(),
      email: String(data.email ?? "").trim(),
      PrimeraNotificacionVencimiento: Number(data.PrimeraNotificacionVencimiento ?? 1),
      SegundaNotificacionVencimiento: Number(data.SegundaNotificacionVencimiento ?? 2),
      DiaDespuesVencimiento: Number(data.DiaDespuesVencimiento ?? 3),
      ClientId: String(data.ClientId ?? data.clientId ?? data.ClienteId ?? "").trim(),
      ClientSecret: String(data.ClientSecret ?? data.clientSecret ?? "").trim(),
    };

    if (!enterpriseBase.ruc || !enterpriseBase.razonSocial || !enterpriseBase.usuarioSunat || !enterpriseBase.claveSunat) {
      Alert.alert("Validación", "Completa RUC, razón social, usuario SUNAT y clave SUNAT.");
      return;
    }

    try {
      setIsSaving(true);
      let response: any;

      if (mode === "edit" && idEmpresa) {
        const selectedDeclarations = new Set(
          (Array.isArray(data.declaraciones) ? data.declaraciones : []).map(String)
        );
        const declarations: DeclaracionDTO[] = (Array.isArray(data.declaracionesOriginales)
          ? data.declaracionesOriginales
          : []
        ).map((declaration: DeclaracionDTO) => ({
          ...declaration,
          activo: selectedDeclarations.has(String(declaration.idFormulario)),
        }));
        const enterprise: UpdateEnterpriseRequest = {
          ...enterpriseBase,
          idEmpresa,
          declaraciones: declarations,
        };

        response = await enterpriseService.updateEnterprise({
          idEmpresa: idEmpresa.toString(),
          enterprise,
        });
      } else {
        const enterprise: SaveEnterpriseRequest = {
          ...enterpriseBase,
          declaraciones: Array.isArray(data.declaraciones) ? data.declaraciones.map(String) : [],
        };
        response = await enterpriseService.saveEnterprise({ enterprise});
      }

      const result = response?.data ?? response;
      if (result?.success === false || result?.isSuccess === false) {
        throw new Error(result?.message ?? result?.mensaje ?? "El servidor rechazó la actualización.");
      }

      Alert.alert("Éxito", mode === "edit" ? "Empresa actualizada Correctamente!." : "Empresa registrada Correctamente!.");
      await onSaved();
    } catch (error: any) {
      const responseData = error?.response?.data;
      const validationMessages = responseData?.errors
        ? Object.values(responseData.errors).flat().join("\n")
        : "";
      const message = typeof responseData === "string"
        ? responseData
        : responseData?.detail ??
          responseData?.message ??
          responseData?.mensaje ??
          responseData?.title ??
          (validationMessages || error?.message);
      Alert.alert("Error al guardar", message || "No se pudo guardar la empresa.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#743484" />
        <Text style={styles.loadingText}>Cargando empresa...</Text>
      </View>
    );
  }

  if (loadError) {
    return <Text style={styles.errorText}>{loadError}</Text>;
  }

  return (
    <View>
   
      {!isReadOnly && !isValidConnection && (
        <View style={styles.alert}>
          <Text style={styles.alertText}>
            Para realizar modificaciones, primero debe validar su acceso a
            SUNAT.
          </Text>
        </View>
      )}
      <Text style={styles.subtitle}>Información de Empresa</Text>
      <FieldInput
        label="RUC"
        value={String(data.ruc ?? "")}
        placeholder="Ingrese el RUC"
        keyboardType="numeric"
        maxLength={11}
        editable={!isReadOnly}
        onChangeText={(value) => handleFieldChange("ruc", value)}
        styleContainer={styles.fullWidth}
      />
      <FieldInput
        label="Razón social"
        value={String(data.razonSocial ?? "")}
        placeholder="Razón social"
        editable={false}
        styleContainer={styles.fullWidth}
      />
      <FieldInput
        label="Usuario SUNAT"
        value={String(data.usuarioSunat ?? "")}
        placeholder="Usuario SUNAT"
        editable={!isReadOnly}
        onChangeText={(value) => handleFieldChange("usuarioSunat", value)}
        styleContainer={styles.fullWidth}
      />
      <FieldInput
        label="Clave SUNAT"
        value={String(data.claveSunat ?? "")}
        placeholder="Clave SUNAT"
        secureTextEntry
        editable={!isReadOnly}
        onChangeText={(value) => handleFieldChange("claveSunat", value)}
        styleContainer={styles.fullWidth}
      />

      {!isReadOnly && (
        <Pressable
          onPress={handleValidateSunat}
          disabled={isValidating}
          style={({ pressed }) => [
            styles.primaryButton,
            isValidating && styles.primaryButtonDisabled,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          {isValidating ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="connection" size={16} color="#fff" />
          )}
          <Text style={styles.primaryButtonText}>
            {isValidating ? "Validando..." : "Validar acceso a SUNAT"}
          </Text>
        </Pressable>
      )}

      {(isValidConnection || isReadOnly) && (
        <View>
          <Text style={styles.subtitle}>Datos de API SUNAT</Text>
          <FieldInput
            label="ID"
            value={String(data.ClientId ?? data.clientId ?? "")}
            editable={!isReadOnly}
            onChangeText={(value) => handleFieldChange("ClientId", value)}
            styleContainer={styles.fullWidth}
          />
          <FieldInput
            label="Clave API"
            value={String(data.ClientSecret ?? data.clientSecret ?? "")}
            editable={!isReadOnly}
            onChangeText={(value) => handleFieldChange("ClientSecret", value)}
            styleContainer={styles.fullWidth}
          />

          {data.actividadEconomica ? (
            <FieldInput label="Actividad Económica" value={String(data.actividadEconomica)} editable={false} styleContainer={styles.fullWidth} />
          ) : null}
          {data.regimenTrubitario ? (
            <FieldInput label="Régimen Tributario" value={String(data.regimenTrubitario)} editable={false} styleContainer={styles.fullWidth} />
          ) : null}

          <Text style={styles.subtitle}>Datos de Comunicación</Text>
          <FieldInput
            label="Email"
            value={String(data.email ?? "")}
            placeholder="Correo electrónico"
            keyboardType="email-address"
            editable={!isReadOnly}
            onChangeText={(value) => handleFieldChange("email", value)}
            styleContainer={styles.fullWidth}
          />
          <Text style={styles.subtitle}>Declaraciones a monitorear</Text>
          <CheckboxGroup
            options={[
              { label: "Planilla Electrónica", value: "601" },
              { label: "IGV - Renta", value: "621" },
            ]}
            disabled={isReadOnly}
            value={Array.isArray(data.declaraciones) ? data.declaraciones : []}
            onChange={(value) => handleFieldChange("declaraciones", value)}
          />
        </View>
      )}

      {!isReadOnly && (
        <Pressable
          onPress={handleSaveEnterprise}
          disabled={isSaving || !isValidConnection}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.saveButton,
            (isSaving || !isValidConnection) && styles.primaryButtonDisabled,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          {isSaving ? <ActivityIndicator size="small" color="#fff" /> : null}
          <Text style={styles.primaryButtonText}>{isSaving ? "Guardando..." : mode === "add" ? "Registrar" : "Actualizar"}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function EnterpriseForm({
  handleValidateAccess,
  razonSocial,
  isValidConnection,
  enterpriseDefaultValues,
  sunatDefaulValues,
  mode: modeProp,
  visibleMensaje,
  idEmpresa,
}: EnterpriseFormProps) {
  const params = useLocalSearchParams<{ mode?: ModeState }>();
  const mode: ModeState = (params.mode as ModeState) || modeProp || "view";

  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [isLoadingValidate, setIsLoadingValidate] = useState(false);
  const [mensajeConexionSunatEditarEmpresa] = useState(
    "Su acceso a SUNAT está validado. Verifique sus credenciales y datos de conexión antes de continuar."
  );
  const [screenWidth, setScreenWidth] = useState<number>(initialWidth);

  const isEditable = mode !== "view";
  const isEditMode = mode === "edit";
  const isAddMode = mode === "add";

  const schema = enterpiseSchema;
  type FormType = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormType>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...enterpriseDefaultValues,
      clientId: enterpriseDefaultValues?.clientId ?? "",
      clientSecret: enterpriseDefaultValues?.clientSecret ?? "",
      actividadEconomica: enterpriseDefaultValues?.actividadEconomica ?? "",
      regimenTrubitario: enterpriseDefaultValues?.regimenTrubitario ?? "",
    },
    mode: "onChange",
  });

  const {
    control: sunatControl,
    handleSubmit: sunatHandleSubmit,
    reset: sunatReset,
    formState: { errors: sunatErrors },
  } = useForm<SunatSchema>({
    resolver: zodResolver(sunatSchema),
    defaultValues: sunatDefaulValues,
  });

  useEffect(() => {
    reset({
      ...enterpriseDefaultValues,
      clientId: enterpriseDefaultValues?.clientId ?? "",
      clientSecret: enterpriseDefaultValues?.clientSecret ?? "",
      actividadEconomica: enterpriseDefaultValues?.actividadEconomica ?? "",
      regimenTrubitario: enterpriseDefaultValues?.regimenTrubitario ?? "",
    });
    sunatReset(sunatDefaulValues);
  }, [enterpriseDefaultValues, sunatDefaulValues, reset, sunatReset]);

  const onSaveEmpresa = async (data: FormType) => {
    setIsLoadingSave(true);
    const enterprise: SaveEnterpriseRequest = {
      ...data,
      razonSocial,
      PrimeraNotificacionVencimiento: Number(data.primera_notificacion_vencimiento),
      SegundaNotificacionVencimiento: Number(data.segunda_notificacion_vencimiento),
      DiaDespuesVencimiento: Number(data.dia_despues_vencimiento),
      ClientId: data.clientId ?? "",
      ClientSecret: data.clientSecret ?? "",
    };

    try {
      if (isEditMode) {
        if (!idEmpresa) {
          throw new Error("No se recibió el identificador de la empresa a actualizar.");
        }
        Alert.alert("Id Empresa", idEmpresa);
        await enterpriseService.updateEnterprise({ idEmpresa, enterprise });
      } else {
        await enterpriseService.saveEnterprise({ enterprise });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la empresa.";
      Alert.alert("Error", message);
    } finally {
      setIsLoadingSave(false);
    }
  };

  const onValidateSUNAT = async (access: SunatSchema) => {
    setIsLoadingValidate(true);
    try {
      await handleValidateAccess({ access });

      reset({
        ...getValues(),
        usuarioSunat: access.usuarioSunat,
        claveSunat: access.claveSunat,
        ruc: access.ruc,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo validar el acceso a SUNAT.";
      Alert.alert("Error de conexión", message);
    } finally {
      setIsLoadingValidate(false);
    }
  };

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number; height: number } }) => {
      setScreenWidth(window.width);
    };
    const subscription = Dimensions.addEventListener("change", onChange);
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  const alertWidth = screenWidth <= 600 ? "100%" : "50%";

  return (
    <View style={styles.containerForm}>
      {isEditMode && !isValidConnection && (
        <View style={[styles.alert, { width: alertWidth }]}>
          <Text style={styles.alertText}>Para realizar modificaciones, primero debe validar su acceso a SUNAT.</Text>
        </View>
      )}

      <Text style={styles.subtitle}>Información de Empresa</Text>

      <View style={styles.container}>
        <Controller
          control={sunatControl}
          name="ruc"
          render={({ field }: { field: RHFField }) => (
            <FieldInput
              label="RUC"
              value={String(field.value ?? "")}
              onChangeText={(value) => field.onChange(value)}
              placeholder="Ingrese el RUC"
              editable={isAddMode}
              keyboardType="numeric"
              maxLength={11}
              styleContainer={styles.inputContainer}
              error={sunatErrors.ruc?.message}
            />
          )}
        />

        <FieldInput
          label="Razón Social"
          value={razonSocial}
          editable={false}
          styleContainer={styles.inputContainer}
        />
      </View>

      <View style={styles.container}>
        <Controller
          control={sunatControl}
          name="usuarioSunat"
          render={({ field }: { field: RHFField }) => (
            <FieldInput
              label="Usuario SUNAT"
              value={String(field.value ?? "")}
              onChangeText={(value) => field.onChange(value)}
              placeholder="Usuario SUNAT"
              editable={isEditable && !isValidConnection}
              styleContainer={styles.inputContainer}
              error={sunatErrors.usuarioSunat?.message}
            />
          )}
        />

        <Controller
          control={sunatControl}
          name="claveSunat"
          render={({ field }: { field: RHFField }) => (
            <FieldInput
              label="Clave SUNAT"
              value={String(field.value ?? "")}
              onChangeText={(value) => field.onChange(value)}
              placeholder="Clave SUNAT"
              editable={isEditable && !isValidConnection}
              secureTextEntry
              styleContainer={styles.inputContainer}
              error={sunatErrors.claveSunat?.message}
            />
          )}
        />
      </View>

      {isEditable && (
        <Pressable
          onPress={sunatHandleSubmit(onValidateSUNAT)}
          disabled={!isEditable || isValidConnection || isLoadingValidate}
          style={({ pressed }) => [
            styles.primaryButton,
            (!isEditable || isValidConnection || isLoadingValidate) && styles.primaryButtonDisabled,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          {isLoadingValidate ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="connection" size={16} color="#fff" />
          )}
          <Text style={styles.primaryButtonText}>
            {isLoadingValidate ? "Validando..." : "Validar acceso a SUNAT"}
          </Text>
        </Pressable>
      )}

      {((isEditMode || isAddMode) && isValidConnection) || mode === "view" ? (
        <View style={styles.sectionBox}>
          <Text style={styles.subtitle}>Datos de API SUNAT</Text>
          {visibleMensaje && (
            <View style={styles.messageBox}>
              <Text style={styles.messageText}>{mensajeConexionSunatEditarEmpresa}</Text>
            </View>
          )}

          <View style={styles.container}>
            <Controller
              control={control}
              name="clientId"
              render={({ field }: { field: RHFField }) => (
                <FieldInput
                  label="ID"
                  value={String(field.value ?? "")}
                  onChangeText={(value) => field.onChange(value)}
                  placeholder="ID"
                  editable={isEditable && visibleMensaje}
                  styleContainer={styles.inputContainer}
                  error={errors.clientId?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="clientSecret"
              render={({ field }: { field: RHFField }) => (
                <FieldInput
                  label="CLAVE"
                  value={String(field.value ?? "")}
                  onChangeText={(value) => field.onChange(value)}
                  placeholder="CLAVE"
                  editable={isEditable && visibleMensaje}
                  styleContainer={styles.inputContainer}
                  error={errors.clientSecret?.message}
                />
              )}
            />
          </View>

          {watch("actividadEconomica") && watch("regimenTrubitario") ? (
            <>
              <Text style={styles.subtitle}>Datos de Tributación de la Empresa</Text>
              <View style={styles.container}>
                <View style={styles.inputContainer}>
                  <FieldLabel label="Actividad Económica" />
                  <Text style={styles.labelValue}>{watch("actividadEconomica")}</Text>
                </View>

                <View style={styles.inputContainer}>
                  <FieldLabel label="Régimen Tributario" />
                  <Text style={styles.labelValue}>{watch("regimenTrubitario")}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {(isEditable || mode === "view") && (
        <View style={styles.sectionBox}>
          <Text style={styles.subtitle}>Datos de Comunicación</Text>
          {isAddMode && isValidConnection && (
            <Text style={styles.messageInfo}>
              A este correo le enviaremos recordatorios sobre los vencimientos de sus declaraciones y pagos.
            </Text>
          )}
          <Controller
            control={control}
            name="email"
            render={({ field }: { field: RHFField }) => (
              <FieldInput
                label="Correo Electrónico"
                value={String(field.value ?? "")}
                onChangeText={(value) => field.onChange(value)}
                placeholder="Correo electrónico"
                editable={isEditable}
                keyboardType="email-address"
                styleContainer={styles.fullWidth}
                error={errors.email?.message}
              />
            )}
          />
        </View>
      )}

      {(isEditable || mode === "view") && (
        <View style={styles.sectionBox}>
          <Text style={styles.subtitle}>Seleccionar Declaraciones a Monitorear</Text>
          <Controller
            control={control}
            name="declaraciones"
            render={({ field }: { field: RHFField }) => (
              <View>
                <CheckboxGroup
                  options={[
                    { label: "Planilla Electrónica", value: "601" },
                    { label: "IGV - Renta", value: "621" },
                  ]}
                  disabled={!isEditable}
                  value={Array.isArray(field.value) ? field.value : []}
                  onChange={(value) => field.onChange(value)}
                />
                {errors.declaraciones && (
                  <Text style={styles.errorText}>{String(errors.declaraciones.message)}</Text>
                )}
              </View>
            )}
          />
        </View>
      )}

      {isEditable && (
        <Pressable
          onPress={handleSubmit(onSaveEmpresa)}
          disabled={!isEditable || !isValidConnection}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.saveButton,
            (!isEditable || !isValidConnection) && styles.primaryButtonDisabled,
            pressed && styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>{isAddMode ? "Registrar" : "Actualizar"}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  containerForm: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 12,
    paddingBottom: 20,
    backgroundColor: "transparent",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginVertical: 15,
    color: "#1f2937",
  },
  container: {
    flexDirection: "row",
    paddingVertical: 4,
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "transparent",
  },
  inputContainer: {
    width: "48%",
  },
  fullWidth: {
    width: "100%",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
  },
  loadingText: {
    marginTop: 10,
    color: "#4A5568",
    fontSize: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 14,
    color: "#111827",
  },
  inputDisabled: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 11,
    marginTop: 4,
  },
  alert: {
    backgroundColor: "#dbeafe",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#93c5fd",
    marginTop: 12,
  },
  alertText: {
    color: "#1d4ed8",
    fontSize: 14,
    textAlign: "center",
  },
  sectionBox: {
    marginTop: 8,
    backgroundColor: "transparent",
  },
  messageBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: 12,
  },
  messageText: {
    color: "#374151",
    fontSize: 13,
    lineHeight: 20,
  },
  messageInfo: {
    fontStyle: "italic",
    fontWeight: "bold",
    marginBottom: 8,
    color: "#4b5563",
  },
  labelValue: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: "#111827",
    minHeight: 40,
    textAlignVertical: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
  },
  checkboxGroup: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxBoxChecked: {
    backgroundColor: "#461158d1",
    borderColor: "#2d2e31",
  },
  checkboxBoxDisabled: {
    backgroundColor: "#e5e7eb",
  },
  checkboxLabel: {
    color: "#111827",
    fontSize: 14,
  },
  checkboxLabelDisabled: {
    color: "#9ca3af",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#461158d1",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 20,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonDisabled: {
    backgroundColor: "#878488d8",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  
});