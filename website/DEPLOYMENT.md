# Guía de Deployment - FinanzApp Website

Guía completa para configurar y desplegar el sitio web de FinanzApp en EC2 con Nginx.

## Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Configuración de DNS](#configuración-de-dns)
3. [Setup Inicial en EC2](#setup-inicial-en-ec2)
4. [Configuración de Nginx](#configuración-de-nginx)
5. [Deployment del Sitio](#deployment-del-sitio)
6. [Configuración de SSL/HTTPS](#configuración-de-sslhttps)
7. [Deployment Automático](#deployment-automático)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisitos

- Acceso SSH a tu instancia EC2
- Dominio `finanzapp.info` registrado
- Acceso al panel de DNS de tu proveedor de dominio
- Docker instalado en EC2 (ya debería estar instalado para el backend)

---

## Configuración de DNS

### Paso 1: Obtener IP de EC2

Tu IP de EC2 es: `18.222.119.175`

### Paso 2: Configurar Registros DNS

En el panel de DNS de tu proveedor de dominio (donde registraste `finanzapp.info`), agrega estos registros:

```
Type: A
Name: @
Value: 18.222.119.175
TTL: 3600

Type: A
Name: www
Value: 18.222.119.175
TTL: 3600
```

**Nota**: Si ya tienes estos registros configurados (como parece ser tu caso), no necesitas hacer nada más. Los registros A son suficientes para que el sitio web funcione.

**Opcional - Registro CAA (recomendado para seguridad SSL):**

```
Type: CAA
Name: @
Value: 0 issue "letsencrypt.org"
TTL: 3600
```

Este registro permite que Let's Encrypt emita certificados SSL para tu dominio y mejora la seguridad.

### Paso 3: Verificar Propagación DNS

Espera 5-30 minutos y verifica que el DNS se haya propagado:

```bash
# Desde tu computadora
dig finanzapp.info
# o
nslookup finanzapp.info
```

Deberías ver la IP `18.222.119.175` en la respuesta.

---

## Setup Inicial en EC2

### Paso 1: Conectar a EC2

```bash
ssh -i "finanzapp-backend.pem" ubuntu@ec2-18-222-119-175.us-east-2.compute.amazonaws.com
```

O si tienes configurado SSH config:

```bash
ssh aws
```

### Paso 2: Instalar Nginx

```bash
sudo apt update
sudo apt install -y nginx
```

### Paso 3: Verificar Instalación

```bash
sudo systemctl status nginx
```

Deberías ver que Nginx está activo y corriendo.

---

## Configuración de Nginx

### Paso 1: Copiar Configuración

Desde tu computadora, copia la configuración de Nginx a EC2:

```bash
scp -i "finanzapp-backend.pem" backend/aws-api/nginx/finanzapp.conf ubuntu@ec2-18-222-119-175.us-east-2.compute.amazonaws.com:~/finanzapp.conf
```

O si ya estás en EC2 y tienes el repo clonado:

```bash
cd ~/finanzapp
sudo cp backend/aws-api/nginx/finanzapp.conf /etc/nginx/sites-available/finanzapp.info
```

### Paso 2: Crear Symlink

```bash
sudo ln -s /etc/nginx/sites-available/finanzapp.info /etc/nginx/sites-enabled/
```

### Paso 3: Remover Configuración por Defecto (Opcional)

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### Paso 4: Verificar Configuración

```bash
sudo nginx -t
```

Deberías ver: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

### Paso 5: Recargar Nginx

```bash
sudo systemctl reload nginx
```

---

## Deployment del Sitio

### Opción A: Deployment Manual

1. **Conectar a EC2:**

```bash
ssh aws
cd ~/finanzapp
```

2. **Actualizar código:**

```bash
git pull origin main
```

3. **Deployar sitio:**

```bash
cd website
chmod +x deploy.sh
./deploy.sh
```

El script:

- Construye la imagen Docker
- Detiene el contenedor anterior
- Inicia el nuevo contenedor en puerto 3000
- Verifica que el sitio esté funcionando

### Opción B: Deployment Automático

Ver sección [Deployment Automático](#deployment-automático) más abajo.

### Verificar Deployment

```bash
# Desde EC2
curl http://localhost:3000

# Desde tu computadora (después de configurar DNS)
curl http://finanzapp.info
```

---

## Configuración de SSL/HTTPS

### Paso 1: Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Paso 2: Obtener Certificado SSL

```bash
sudo certbot --nginx -d finanzapp.info -d www.finanzapp.info
```

Certbot te pedirá:

- Email para notificaciones (opcional)
- Aceptar términos de servicio
- Si quieres redirigir HTTP a HTTPS (recomendado: Sí)

### Paso 3: Verificar Renovación Automática

Certbot configura renovación automática, pero puedes verificar:

```bash
sudo certbot renew --dry-run
```

### Paso 4: Verificar HTTPS

```bash
curl https://finanzapp.info
```

Deberías ver el contenido del sitio sin errores de certificado.

---

## Deployment Automático

El sitio se despliega automáticamente cuando haces push a `main` si hay cambios en `website/`.

### Configuración de GitHub Secrets

Los secrets ya deberían estar configurados para el backend. Si no, agrega en GitHub → Settings → Secrets:

- `EC2_SSH_KEY`: Contenido de tu archivo `.pem`
- `EC2_HOST`: `ec2-18-222-119-175.us-east-2.compute.amazonaws.com`
- `EC2_USER`: `ubuntu`

### Verificar Deployment

1. Haz un cambio en `website/`
2. Commit y push a `main`:

```bash
git add website/
git commit -m "feat: update website"
git push origin main
```

3. Ve a GitHub → Actions y verifica que el workflow `Website CI` se ejecute correctamente.

---

## Troubleshooting

### El sitio no carga

1. **Verificar que el contenedor esté corriendo:**

```bash
docker ps | grep finanzapp-website
```

2. **Verificar logs del contenedor:**

```bash
docker logs finanzapp-website
```

3. **Verificar que Nginx esté corriendo:**

```bash
sudo systemctl status nginx
```

4. **Verificar configuración de Nginx:**

```bash
sudo nginx -t
```

### Error 502 Bad Gateway

Esto significa que Nginx no puede conectarse al contenedor de Next.js.

1. **Verificar que el contenedor esté en puerto 3000:**

```bash
docker ps | grep finanzapp-website
# Debería mostrar: 0.0.0.0:3000->3000/tcp
```

2. **Verificar que el sitio responda localmente:**

```bash
curl http://localhost:3000
```

3. **Revisar logs de Nginx:**

```bash
sudo tail -f /var/log/nginx/error.log
```

### DNS no resuelve

1. **Verificar propagación:**

```bash
dig finanzapp.info
```

2. **Esperar más tiempo** (puede tardar hasta 48 horas, pero usualmente es 5-30 minutos)

3. **Verificar registros DNS en tu proveedor** - asegúrate de que apunten a `18.222.119.175`

### Certificado SSL no funciona

1. **Verificar que el certificado existe:**

```bash
sudo certbot certificates
```

2. **Verificar configuración de Nginx:**

```bash
sudo nginx -t
```

3. **Revisar logs de Certbot:**

```bash
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### El sitio carga pero muestra error de Next.js

1. **Verificar logs del contenedor:**

```bash
docker logs finanzapp-website --tail 50
```

2. **Verificar que el build se haya completado:**

```bash
docker exec finanzapp-website ls -la /app/.next
```

3. **Reconstruir el contenedor:**

```bash
cd ~/finanzapp/website
./deploy.sh
```

---

## Comandos Útiles

### Ver logs del sitio

```bash
docker logs -f finanzapp-website
```

### Reiniciar el sitio

```bash
docker restart finanzapp-website
```

### Reiniciar Nginx

```bash
sudo systemctl restart nginx
```

### Ver estado de servicios

```bash
# Estado del contenedor
docker ps | grep finanzapp-website

# Estado de Nginx
sudo systemctl status nginx

# Estado de certificados SSL
sudo certbot certificates
```

### Ver uso de recursos

```bash
docker stats finanzapp-website --no-stream
```

---

## Arquitectura Final

```
Usuario → finanzapp.info (DNS) → EC2 (18.222.119.175)
                                    ↓
                                 Nginx (puerto 80/443)
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
        Next.js (puerto 3000)              Backend API (puerto 8080)
        finanzapp-website container        finanzapp-api container
```

---

## Próximos Pasos

- [ ] Configurar monitoreo (Sentry para el sitio web)
- [ ] Agregar analytics (Google Analytics, Plausible, etc.)
- [ ] Configurar CDN (CloudFront) para assets estáticos
- [ ] Agregar más contenido (screenshots, videos, etc.)

---

## Referencias

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Docker Documentation](https://docs.docker.com/)
