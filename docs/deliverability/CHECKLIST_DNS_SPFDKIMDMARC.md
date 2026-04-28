# Checklist DNS hoy - SPF, DKIM, DMARC

Objetivo: mejorar entregabilidad y reducir SPAM en correos de bienvenida de Horizonte Emirates.

## 1) SPF (obligatorio)

- En el DNS del dominio de envio, verificar que existe **un solo** registro SPF (TXT).
- Valor recomendado base para Google Workspace:
  - `v=spf1 include:_spf.google.com ~all`
- Si ya hay proveedores adicionales de envio, consolidarlos en el mismo SPF (sin duplicar registros SPF).
- Validar que no supera 10 lookups DNS.

## 2) DKIM (obligatorio)

- En Google Admin, ir a Gmail -> Autenticar correo (DKIM).
- Generar clave DKIM para el dominio de envio (selector recomendado: `google` si no existe otro).
- Publicar en DNS el TXT DKIM que entrega Google.
- Activar firma DKIM en Google Admin.
- Verificar que los correos salen con `dkim=pass`.

## 3) DMARC (obligatorio)

- Crear registro TXT en `_dmarc.tudominio.com`.
- Fase inicial recomendada (monitorizacion):
  - `v=DMARC1; p=none; rua=mailto:dmarc@tudominio.com; fo=1; adkim=s; aspf=s`
- Tras 1-2 semanas con buen resultado, endurecer:
  - Fase 2: `p=quarantine`
  - Fase 3: `p=reject`

## 4) Alineacion remitente (clave anti-spam)

- En Apps Script/Gmail, usar remitente real del dominio (ej. `hola@horizonteemirates.com`) verificado en Gmail.
- Evitar mezclar `From` de un dominio y infraestructura de otro sin alineacion SPF/DKIM.
- Mantener `From` estable y consistente en todas las secuencias.

## 5) Verificacion tecnica inmediata

- Enviar prueba a Gmail y revisar encabezados completos:
  - `spf=pass`
  - `dkim=pass`
  - `dmarc=pass`
- Confirmar que el dominio de `From` alinea con SPF o DKIM (ideal ambos).
- Revisar carpeta SPAM y mover a bandeja principal en pruebas internas.

## 6) Checklist de contenido (hoy mismo)

- Primer email de bienvenida:
  - corto (texto directo),
  - tono conversacional 1:1,
  - 1 enlace principal (WhatsApp o Calendly, no ambos en A1).
- Evitar exceso de enlaces, mayusculas comerciales y lenguaje promocional agresivo.

## 7) Monitorizacion semanal

- Metrica principal: `% de correos de bienvenida que llegan a inbox`.
- Revisar rebotes, bloqueos y respuestas.
- Si sube SPAM:
  - comprobar autentificacion,
  - reducir carga comercial del copy,
  - limpiar base (sin correos dudosos/inactivos).

## 8) Orden recomendado de ejecucion hoy

1. Publicar SPF correcto.
2. Activar DKIM en Google Admin + DNS.
3. Publicar DMARC en modo `p=none`.
4. Verificar encabezados en 2-3 envios de prueba.
5. Confirmar ubicacion inbox/SPAM.
6. Ajustar a `p=quarantine` cuando la tasa de pass sea estable.

