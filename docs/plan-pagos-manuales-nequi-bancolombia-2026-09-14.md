# Plan De Implementacion - Pagos Manuales Nequi + Bancolombia

## Estado Del Documento

- Fecha: 2026-09-14
- Objetivo: definir el cambio antes de aplicarlo en codigo
- Estado actual del proyecto:
  - Mercado Pago ya se usa solo para la comision del creador despues de 50 ventas pagadas
  - existe flujo manual funcional para Nequi
  - falta generalizar ese flujo para soportar tambien Bancolombia sin duplicar logica
- Decision de producto:
  - pagos de participantes: directos al creador por `Nequi` o `Bancolombia`
  - Mercado Pago: solo para pagar la comision de la plataforma

## Objetivo Del Cambio

Reemplazar el concepto actual de "pago manual por Nequi" por un sistema mas general de "pagos manuales al creador", manteniendo una UX simple:

1. el creador registra sus datos de cobro
2. el admin valida la identidad y el soporte bancario
3. el creador habilita por rifa los metodos que quiere aceptar
4. el participante paga directamente al creador
5. el participante sube comprobante
6. el creador aprueba o rechaza el comprobante
7. la reserva queda `paid`

## Regla De Negocio Final

- El comprador no paga recargo extra.
- El creador puede cobrar manualmente por:
  - Nequi
  - Bancolombia por QR
  - Bancolombia por transferencia
- Mercado Pago queda reservado para:
  - cobrar la comision del 3% al creador
  - mantener el bloqueo automatico despues de 50 boletas vendidas si no la paga
- El dinero de las rifas no entra a una sola cuenta de plataforma.
- Cada creador cobra directamente en sus propios metodos aprobados.

## Arquitectura A Implementar

### Capa 1. Verificacion Del Creador

Se conserva el patron actual de verificacion, pero deja de ser "solo Nequi" y pasa a ser una verificacion del creador para cobro manual.

Datos obligatorios:

- tipo de documento
- numero de documento
- foto del documento
- titular de la cuenta
- certificado bancario o soporte del metodo principal

Datos opcionales o por metodo:

- telefono Nequi
- QR Nequi
- QR Bancolombia
- cuenta Bancolombia o descripcion corta para transferencia

### Capa 2. Metodos De Cobro Del Creador

Se crea una capa separada para que un creador pueda tener varios metodos aprobados al mismo tiempo.

Metodos iniciales:

- `nequi`
- `bancolombia_qr`
- `bancolombia_transfer`

Cada metodo guardara:

- `user_id`
- `method_type`
- `label`
- `account_holder_name`
- `phone_number`
- `account_number_masked` o alias visible
- `qr_image_url`
- `certificate_url`
- `is_enabled`
- `is_verified`

### Capa 3. Metodos Habilitados Por Rifa

Cada rifa podra activar uno o varios metodos ya verificados del creador.

La rifa no guardara demasiada logica bancaria; solo referenciara metodos aprobados del creador y, si hace falta, una sobrescritura ligera.

### Capa 4. Checkout De Pagos Manuales

El checkout ya no mostrara una tab fija de "Nequi", sino tabs de pago manual segun los metodos activos de la rifa.

Ejemplos:

- `Pagar con Nequi`
- `Pagar con Bancolombia`

Cada tab mostrara:

- nombre del metodo
- datos publicos del creador para pagar
- QR si existe
- instrucciones cortas
- carga del comprobante

### Capa 5. Revision De Comprobantes

No se debe duplicar logica por banco.

El creador seguira revisando comprobantes en una sola lista central, con estos campos:

- metodo usado
- monto
- referencia
- telefono del pagador
- imagen del comprobante
- estado `pending|approved|rejected`

## Diseno De Base De Datos

## Opcion Recomendada

Mantener compatibilidad con la migracion actual y evolucionar sin romper el flujo Nequi existente.

### Tabla 1. `creator_payment_verifications`

Reemplaza conceptualmente a `user_nequi_verifications`.

Campos propuestos:

- `id`
- `user_id`
- `document_type`
- `document_number`
- `document_image_url`
- `account_holder_name`
- `primary_support_url`
- `status`
- `review_admin_id`
- `review_notes`
- `reviewed_at`
- `created_at`
- `updated_at`

Nota:

- en una primera iteracion, se puede reutilizar `user_nequi_verifications` y solo ampliar campos
- en una segunda iteracion, se migra a nombre generico

### Tabla 2. `creator_payment_methods`

Nueva tabla.

Campos:

- `id`
- `user_id`
- `method_type` `nequi|bancolombia_qr|bancolombia_transfer`
- `label`
- `phone_number`
- `account_holder_name`
- `account_number_masked`
- `qr_image_url`
- `support_document_url`
- `status` `pending|approved|rejected`
- `review_admin_id`
- `review_notes`
- `reviewed_at`
- `created_at`
- `updated_at`

### Tabla 3. `rifa_manual_payment_methods`

Nueva tabla para enlazar una rifa con uno o varios metodos manuales del creador.

Campos:

- `rifa_id`
- `creator_payment_method_id`
- `sort_order`
- `is_enabled`
- `instructions_override`
- `created_at`
- `updated_at`

### Tabla 4. `manual_payments`

Evolucion recomendada de `nequi_payments`.

Campos:

- `id`
- `rifa_id`
- `user_id`
- `creator_payment_method_id`
- `payment_method_type`
- `reserva_ids`
- `numbers`
- `amount`
- `voucher_image_url`
- `voucher_reference`
- `payer_phone`
- `status`
- `reviewed_by`
- `review_notes`
- `reviewed_at`
- `created_at`
- `updated_at`

Nota importante:

- para un cambio mas seguro, primero se puede renombrar solo a nivel logico y mantener la tabla fisica `nequi_payments`
- despues, en una fase de refactor controlada, se renombra a `manual_payments`

## Estrategia De Migracion Recomendada

## Fase A. Cambio Seguro Sin Romper Nada

Objetivo: soportar Bancolombia rapido usando la base actual de Nequi.

Acciones:

1. ampliar `rifa_payment_methods`
2. ampliar `user_nequi_verifications`
3. ampliar `nequi_payments`
4. renombrar componentes y textos de UI, pero sin renombrar tablas de inmediato

Ventajas:

- menor riesgo
- menos cambios en RLS
- mas rapido de desplegar

### Campos A Agregar En Esta Fase

En `user_nequi_verifications`:

- `account_holder_name`
- `bancolombia_qr_url`
- `bancolombia_account_label`
- `bancolombia_certificate_url`

En `rifa_payment_methods`:

- `accept_bancolombia_qr`
- `accept_bancolombia_transfer`
- `bancolombia_qr_override_url`
- `bancolombia_account_override`

En `nequi_payments` o tabla equivalente temporal:

- `payment_method_type`

Valores:

- `nequi`
- `bancolombia_qr`
- `bancolombia_transfer`

## Fase B. Refactor Estructural

Objetivo: dejar nombres genericos y arquitectura limpia.

Acciones:

1. crear `creator_payment_methods`
2. migrar datos legacy de Nequi
3. crear `manual_payments`
4. reemplazar lecturas de tablas legacy
5. retirar nombres especificos `nequi_*`

## Archivos Que Habra Que Crear

### SQL

- nueva migracion `0013_manual_creator_payment_methods.sql`
- opcional futura migracion de refactor semantico `0014_manual_payments_refactor.sql`

### UI

- `components/payments/ManualPaymentMethodsForm.tsx`
- `components/payments/ManualPaymentCheckoutPane.tsx`
- `components/payments/ManualVoucherReviewList.tsx`
- `components/payments/CreatorPaymentVerificationForm.tsx`

### API

- `app/api/admin/manual-payment-methods/[id]/review/route.ts`
- `app/api/manual-payments/[id]/review/route.ts`

## Archivos Que Habra Que Editar

### Base Actual Nequi

- `components/nequi/NequiVerificationForm.tsx`
- `components/nequi/PaymentMethodsToggles.tsx`
- `components/nequi/NequiCheckoutPane.tsx`
- `components/nequi/VoucherReviewList.tsx`
- `app/api/admin/nequi-verifications/[id]/review/route.ts`
- `app/api/nequi-payments/[id]/review/route.ts`
- `app/(app)/perfil/page.tsx`
- `app/(app)/admin/verificaciones-nequi/page.tsx`
- `app/(app)/checkout/[reservaId]/page.tsx`
- `app/(app)/mis-rifas/comprobantes-nequi/[rifaId]/page.tsx`
- `app/(app)/rifas/crear/page.tsx`
- `components/rifas/CreatorForm.tsx`
- `lib/types.ts`

### Comision Del Creador

Estas piezas deben mantenerse casi igual:

- `lib/creator-fees.ts`
- `app/api/creator-fees/create-preference/route.ts`
- `app/api/mercadopago/webhook/route.ts`
- `app/(app)/mis-rifas/creadas/page.tsx`

Solo requieren ajustes de copy para dejar claro que Mercado Pago es exclusivamente para la comision.

## Cambios Concretos En UX

### Perfil Del Creador

Estado futuro:

- ya no dirá solo "Pago con Nequi"
- dirá algo como `Cobros manuales`

Contenido:

- verificacion de identidad
- carga de soporte bancario
- configuracion de metodos:
  - Nequi
  - Bancolombia QR
  - Bancolombia transferencia

### Crear O Editar Rifa

Estado futuro:

- ya no se mostrara Mercado Pago como metodo de cobro al participante
- se mostraran:
  - `Nequi`
  - `Bancolombia QR`
  - `Bancolombia transferencia`

Mensaje obligatorio:

- "Los participantes te pagaran directamente a tus datos aprobados. Mercado Pago se usa solo para pagar la comision de la plataforma cuando tu rifa alcance 50 ventas pagadas."

### Checkout Del Participante

Estado futuro:

- si la rifa tiene metodos manuales activos, se muestran tabs dinamicas
- si tiene varios, el participante escoge el que prefiera
- si no tiene metodos activos, no se permite comprar

Mensajes clave:

- "Paga directamente al creador"
- "Sube el comprobante para que el creador confirme tu pago"
- "Mercado Pago no recibe el dinero de esta rifa"

### Mis Rifas Creadas

Seccion adicional o reforzada:

- comision del creador
- estado de la deuda
- recordatorio claro de que el recaudo manual entra a sus propias cuentas/metodos

## Politicas RLS

## Principio

Los datos sensibles completos del creador no deben ser publicos.

### Publico En Checkout

Debe exponerse solo lo necesario para que el participante pague:

- tipo de metodo
- nombre visible del titular o alias
- telefono o cuenta visible
- QR
- instrucciones cortas

### Privado

Debe quedar solo para creador/admin:

- foto del documento
- certificado bancario completo
- notas de revision
- soportes internos

### Recomendacion

Crear una vista publica segura:

- `creator_public_payment_methods`

Campos publicos:

- `rifa_id`
- `creator_payment_method_id`
- `payment_method_type`
- `label`
- `public_phone`
- `public_account_label`
- `public_qr_url`
- `instructions`
- `creator_name`

## Storage

Se mantiene bucket:

- `rifas-media`

Nuevos paths sugeridos:

- `creator-verifications/{userId}/document-*`
- `creator-verifications/{userId}/support-*`
- `creator-methods/{userId}/nequi-qr-*`
- `creator-methods/{userId}/bancolombia-qr-*`
- `manual-vouchers/{rifaId}/{participantUserId}-*`

## Paso A Paso De Implementacion

## Paso 1. Documentar Y Congelar Contrato

- aprobar este documento
- confirmar nombres finales:
  - si se queda `cobros manuales`
  - si se usa `Bancolombia` o `Transferencia Bancolombia`

## Paso 2. Crear Migracion SQL

- agregar campos nuevos en tablas actuales para soporte Bancolombia
- agregar `payment_method_type` en pagos manuales
- agregar indices y policies necesarias
- crear vista publica para checkout

## Paso 3. Ampliar Tipos TS

- extender `lib/types.ts`
- definir enums:
  - `ManualPaymentMethodType`
  - `ManualPaymentStatus`
  - `CreatorVerificationStatus`

## Paso 4. Refactor Del Perfil

- convertir la seccion actual Nequi a una seccion generica de cobros manuales
- permitir cargar:
  - Nequi
  - QR Bancolombia
  - datos de transferencia Bancolombia

## Paso 5. Refactor De Metodos Por Rifa

- actualizar `PaymentMethodsToggles` para:
  - quitar Mercado Pago como cobro al comprador
  - habilitar Nequi
  - habilitar Bancolombia QR
  - habilitar Bancolombia transferencia

## Paso 6. Refactor Del Checkout

- reemplazar `NequiCheckoutPane` por un pane generico
- leer metodos publicos de la vista segura
- renderizar tabs dinamicas
- guardar `payment_method_type` en el comprobante

## Paso 7. Refactor De Aprobacion De Comprobantes

- reutilizar la ruta actual de aprobacion
- agregar soporte para mostrar el metodo usado
- mantener `reserva_ids` como fuente de verdad

## Paso 8. Ajustar Copy Global

- remover textos donde parezca que el dinero entra por Mercado Pago
- dejar claro:
  - MP solo cobra la comision al creador
  - el participante paga directo al creador

## Paso 9. Probar Flujo Completo

Prueba obligatoria:

1. creador configura Nequi y Bancolombia
2. admin aprueba
3. creador activa ambos en una rifa
4. comprador ve ambas tabs
5. comprador paga por Nequi
6. comprador paga por Bancolombia en otra reserva
7. creador aprueba ambos comprobantes
8. reservas quedan `paid`
9. al llegar a 50 ventas, la rifa se pausa si no paga la comision
10. el creador paga la comision por Mercado Pago y la rifa se reactiva

## Riesgos A Controlar

- duplicar logica por metodo y terminar con dos flujos paralelos
- romper RLS del checkout al exponer tablas sensibles
- mantener nombres legacy `nequi_*` mezclados con nombres nuevos y generar confusion
- no dejar claro al creador que Mercado Pago ya no recibe el dinero de la rifa

## Recomendacion De Implementacion

## Camino Recomendado

Aplicar primero la version incremental:

1. extender tablas actuales
2. generalizar componentes actuales
3. soportar `bancolombia_qr` y `bancolombia_transfer`
4. mantener `creator_fee_charges` intacto
5. mover el refactor profundo de nombres para una segunda fase

Esto permite salir rapido, con menos riesgo y aprovechando casi todo el trabajo ya hecho en el flujo Nequi.

## Criterios De Aceptacion

- el participante ya no ve Mercado Pago como destino del dinero de la rifa
- el creador puede configurar Nequi o Bancolombia
- el checkout muestra los metodos activos de la rifa
- el comprobante identifica el metodo usado
- el creador puede aprobar cualquier comprobante manual
- la reserva queda `paid`
- el 3% sigue cobrandose solo al creador via Mercado Pago
- la UI deja esto claro en perfil, crear rifa, checkout y panel del creador

## Que No Se Debe Hacer

- no volver a centralizar el recaudo de las rifas en una sola cuenta de plataforma
- no duplicar tablas completas solo por cambiar de Nequi a Bancolombia
- no exponer certificados o documentos completos en el checkout publico
- no mezclar el flujo de cobro de la rifa con el flujo de cobro de la comision

## Siguiente Paso

Una vez aprobado este documento, el orden sugerido de ejecucion es:

1. migracion SQL incremental
2. tipos TS
3. perfil del creador
4. metodos por rifa
5. checkout manual generico
6. aprobacion de comprobantes
7. build
8. smoke test E2E
9. commit y push a `develop`
