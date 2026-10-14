import { z } from "zod";

export const enterpiseSchema = z.object({
  usuarioSunat: z
    .string()
    .min(1, { message: "El Usuario SUNAT es obligatorio" }),
  claveSunat: z
    .string()
    .min(1, { message: "La Clave SUNAT es obligatoria" }),
  ruc: z
    .string()
    .min(1, { message: "El RUC es obligatorio" })
    .regex(/^\d{10,11}$/, { message: "El RUC debe tener 10 o 11 dígitos" }),
  razonSocial: z
    .string()
    .optional(),
  email: z
    .string()
    .min(1, { message: "El Correo Electrónico es obligatorio" })
    .email({ message: "El Correo Electrónico es inválido" }),
  primera_notificacion_vencimiento: z
    .string()
    .min(1, { message: "El número de días es obligatorio" })
    .regex(/^\d+$/, { message: "Días antes de Vencimiento 1 debe contener solo números" }),
  segunda_notificacion_vencimiento: z
    .string()
    .min(1, { message: "El número de días es obligatorio" })
    .regex(/^\d+$/, { message: "Días antes de Vencimiento 2 debe contener solo números" }),
  dia_despues_vencimiento: z
    .string()
    .min(1, { message: "El número de días es obligatorio" })
    .regex(/^\d+$/, { message: "Días después de Vencimiento debe contener solo números" }),
  declaraciones: z
    .array(z.string())
    .min(1, { message: "Debe seleccionar al menos una declaración a monitorear" }),

  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  actividadEconomica: z.string().optional(),
  regimenTrubitario: z.string().optional(),
}).refine((data) => {
  const primera = Number(data.primera_notificacion_vencimiento);
  const segunda = Number(data.segunda_notificacion_vencimiento);
  
  if (isNaN(primera) || isNaN(segunda)) return true;
  return segunda < primera;
}, {
  message: "La segunda notificación debe ser menor en días a la primera",
  path: ["segunda_notificacion_vencimiento"],
});

export type EnterpriseSchema = z.infer<typeof enterpiseSchema>;