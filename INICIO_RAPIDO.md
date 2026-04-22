# 🚀 Guía de Inicio Rápido

## ⚡ 5 Minutos para Entender el Flujo

### El Problema
```
❌ Usuario intenta acceder a encuesta sin registro
❌ Nadie puede completar la evaluación sin empresa
❌ Perdida de datos sin validación
```

### La Solución
```
✅ Registro obligatorio PRIMERO
✅ Acceso protegido a la encuesta
✅ Sesión persistente
✅ Redirecciones automáticas
```

---

## 🎯 Diagrama Visual Simplificado

```
                    ┌─────────────────┐
                    │  MI APLICACIÓN  │
                    └────────┬────────┘
                             │
                ┌────────────┼────────────┐
                ▼            ▼            ▼
          ┌──────────┐  ┌──────────┐  ┌──────────┐
          │ Landing  │  │ Register │  │  Survey  │
          │          │  │          │  │          │
          │ SIN PROT │  │SIN PROT  │  │ PROTEGID │
          └────┬─────┘  └────┬─────┘  └────┬─────┘
               │             │             │
          "Registrar"    [GUARDAR]    [VALIDAR]
               │          EN BD           │
               └──────────┬──────────────┬┘
                          │              │
                    SI HAY SESIÓN  ✓ OK
                          │              │
                          ▼              ▼
                   [IR A /survey]  [PREGUNTAS]
```

---

## 📋 Checklist de Implementación (Paso a Paso)

### FASE 1: Estructura Base (30 minutos)

- [ ] **1.1** Crear archivos de contexto
  ```
  src/context/AuthContext.jsx
  ```

- [ ] **1.2** Crear carpeta de hooks
  ```
  src/hooks/
    - useAuth.js
    - useSessionGuard.js
    - useFormValidation.js
  ```

- [ ] **1.3** Crear componente ProtectedRoute
  ```
  src/components/ProtectedRoute.jsx
  ```

- [ ] **1.4** Configurar rutas en App.jsx
  ```
  / → /landing
  /landing → Pantalla inicial (sin protección)
  /register → Formulario (sin protección)
  /survey → PROTEGIDO (requiere auth)
  /results → PROTEGIDO (requiere auth)
  ```

---

### FASE 2: Formularios (45 minutos)

- [ ] **2.1** Crear componentes de UI reutilizables
  ```
  src/components/
    - FormField.jsx
    - Button.jsx
    - Message.jsx
    - Card.jsx
  ```

- [ ] **2.2** Crear página Landing.jsx
  ```
  - Título
  - Descripción
  - Botón "Registrar empresa"
  - Redirección automática si ya registrado
  ```

- [ ] **2.3** Crear formulario Register.jsx
  ```
  - Campos: nombreEmpresa, industria, tamano, pais, 
            nombreUsuario, email
  - Validación en tiempo real
  - Envío a API
  - Guardado de sesión
  - Redirección a /survey
  ```

---

### FASE 3: Protección de Rutas (20 minutos)

- [ ] **3.1** Implementar ProtectedRoute
  ```javascript
  Si NO hay sesión:
    - Redirigir a /register
    - Mostrar mensaje
  Si SÍ hay sesión:
    - Permitir acceso
    - Pasar datos a componente
  ```

- [ ] **3.2** Implementar useSessionGuard en páginas protegidas
  ```
  src/pages/
    - Survey.jsx (usa useSessionGuard)
    - Results.jsx (usa useSessionGuard)
  ```

---

### FASE 4: Servicios API (30 minutos)

- [ ] **4.1** Crear archivo companyService.js
  ```javascript
  Funciones:
  - register(companyData)
  - getCompanyInfo(companyId)
  ```

- [ ] **4.2** Crear archivo surveyService.js
  ```javascript
  Funciones:
  - getSurveyQuestions()
  - saveResponse(companyId, userId, questionId, answer)
  - getResults(companyId)
  ```

- [ ] **4.3** Configurar URL base de API
  ```
  .env: REACT_APP_API_URL=http://localhost:3001/api
  ```

---

### FASE 5: Backend (1-2 horas - depende del framework)

- [ ] **5.1** Crear tabla `companies`
  ```sql
  - id (UUID)
  - name (VARCHAR)
  - industry (VARCHAR)
  - size (VARCHAR)
  - country (VARCHAR)
  - created_at (TIMESTAMP)
  ```

- [ ] **5.2** Crear tabla `users`
  ```sql
  - id (UUID)
  - company_id (FK)
  - name (VARCHAR)
  - email (VARCHAR UNIQUE)
  - created_at (TIMESTAMP)
  ```

- [ ] **5.3** Crear endpoints
  ```
  POST /api/companies/register
    → Guarda empresa y usuario
    → Retorna company.id y user.id
  
  POST /api/survey/responses
    → Guarda respuesta
    → Valida que company_id existe
  
  GET /api/survey/results?company_id=xxx
    → Retorna resultados
  ```

---

### FASE 6: Testing (45 minutos)

- [ ] **6.1** Prueba: Sin registro → no accede a /survey
  ```
  1. Borrar localStorage
  2. Intentar ir a /survey
  3. ✓ Debe redirigir a /register
  ```

- [ ] **6.2** Prueba: Registrar → ir a /survey
  ```
  1. Ir a /register
  2. Llena formulario
  3. Envía
  4. ✓ Debe redirigir a /survey
  5. ✓ Sesión guardada en localStorage
  ```

- [ ] **6.3** Prueba: Usuario registrado va a /landing
  ```
  1. Estar registrado
  2. Ir a /landing
  3. ✓ Debe redirigir a /survey
  ```

- [ ] **6.4** Prueba: Logout
  ```
  1. Estar en /survey
  2. Click en "Cerrar sesión"
  3. ✓ localStorage limpio
  4. ✓ Redirigir a /landing
  ```

---

## 🔧 Comando por Comando

### Crear proyecto React

```bash
# Opción 1: Con Vite (recomendado, más rápido)
npm create vite@latest proyecto-encuesta -- --template react
cd proyecto-encuesta
npm install
npm run dev

# Opción 2: Con Create React App
npx create-react-app proyecto-encuesta
cd proyecto-encuesta
npm start
```

### Instalar dependencias necesarias

```bash
# React Router para rutas
npm install react-router-dom

# (Opcional) Librerías útiles
npm install axios              # Cliente HTTP
npm install zustand           # State management alternativa
npm install react-hook-form   # Manejo de formas
npm install vitest            # Testing
```

### Estructura inicial

```bash
mkdir -p src/{components,pages,context,hooks,services,utils,styles}
```

---

## 💾 Archivos Mínimos Necesarios

### 0. App.jsx (Router principal)

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Register from './pages/Register';
import Survey from './pages/Survey';

function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/landing" />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/survey" 
            element={<ProtectedRoute><Survey /></ProtectedRoute>} 
          />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}

export default App;
```

### 1. AuthContext.jsx (Contexto de sesión)

```javascript
import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('session');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSession(parsed);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (sessionData) => {
    localStorage.setItem('session', JSON.stringify(sessionData));
    setSession(sessionData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('session');
    setSession(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ session, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### 2. ProtectedRoute.jsx (Guard de rutas)

```javascript
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <Navigate to="/register" />;
  }
  
  return children;
}
```

### 3. Landing.jsx (Página inicial)

```javascript
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Landing() {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isAuthenticated) navigate('/survey', { replace: true });
  }, [isAuthenticated, navigate]);
  
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1>Evaluación de Madurez Comercial</h1>
      <p>Registra tu empresa para comenzar</p>
      <button onClick={() => navigate('/register')} style={{
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#000',
        color: '#fff',
        border: 'none',
        cursor: 'pointer'
      }}>
        Registrar Empresa
      </button>
    </div>
  );
}
```

### 4. Register.jsx (Formulario de registro)

```javascript
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Register() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreEmpresa: '',
    industria: '',
    tamano: 'medium',
    pais: '',
    nombreUsuario: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Aquí irá la llamada a la API
      // const response = await fetch('/api/companies/register', ...)
      
      // Simulación para testing
      const sessionData = {
        isAuthenticated: true,
        companyId: 'company-' + Date.now(),
        userId: 'user-' + Date.now(),
        companyName: formData.nombreEmpresa,
        userName: formData.nombreUsuario,
        email: formData.email,
        industry: formData.industria,
        country: formData.pais,
        companySize: formData.tamano
      };
      
      login(sessionData);
      navigate('/survey');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '60px auto', padding: '20px' }}>
      <h2>Registra tu Empresa</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <input
          type="text"
          placeholder="Nombre de empresa"
          value={formData.nombreEmpresa}
          onChange={(e) => setFormData({...formData, nombreEmpresa: e.target.value})}
          required
          style={{ marginBottom: '10px', padding: '8px' }}
        />
        
        <select
          value={formData.industria}
          onChange={(e) => setFormData({...formData, industria: e.target.value})}
          required
          style={{ marginBottom: '10px', padding: '8px' }}
        >
          <option value="">Selecciona industria</option>
          <option value="Technology">Tecnología</option>
          <option value="Finance">Finanzas</option>
          <option value="Retail">Retail</option>
        </select>
        
        <input
          type="text"
          placeholder="País"
          value={formData.pais}
          onChange={(e) => setFormData({...formData, pais: e.target.value})}
          required
          style={{ marginBottom: '10px', padding: '8px' }}
        />
        
        <input
          type="text"
          placeholder="Tu nombre"
          value={formData.nombreUsuario}
          onChange={(e) => setFormData({...formData, nombreUsuario: e.target.value})}
          required
          style={{ marginBottom: '10px', padding: '8px' }}
        />
        
        <input
          type="email"
          placeholder="Tu email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
          style={{ marginBottom: '10px', padding: '8px' }}
        />
        
        <button type="submit" disabled={loading} style={{
          padding: '10px',
          backgroundColor: '#000',
          color: '#fff',
          border: 'none',
          cursor: 'pointer'
        }}>
          {loading ? 'Registrando...' : 'Registrar'}
        </button>
      </form>
    </div>
  );
}
```

### 5. Survey.jsx (Encuesta protegida)

```javascript
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Survey() {
  const { session, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/landing');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Encuesta - {session?.companyName}</h1>
      <p>Bienvenido {session?.userName}</p>
      
      {/* Aquí irán las preguntas de la encuesta */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f0f0f0' }}>
        <p>Contenido de la encuesta aquí</p>
        <p>Company ID: {session?.companyId}</p>
        <p>User ID: {session?.userId}</p>
      </div>
      
      <button onClick={handleLogout} style={{
        marginTop: '20px',
        padding: '10px 20px',
        backgroundColor: '#999',
        color: '#fff',
        border: 'none',
        cursor: 'pointer'
      }}>
        Cerrar Sesión
      </button>
    </div>
  );
}
```

---

## 🎬 Inicio Rápido (Copiar y Pegar)

### Paso 1: Crear proyecto
```bash
npm create vite@latest proyecto-encuesta -- --template react
cd proyecto-encuesta
npm install react-router-dom
npm install
```

### Paso 2: Crear carpetas
```bash
mkdir -p src/{components,pages,context}
```

### Paso 3: Copiar archivos
- Copiar **AuthContext.jsx** → `src/context/`
- Copiar **ProtectedRoute.jsx** → `src/components/`
- Copiar **Landing.jsx** → `src/pages/`
- Copiar **Register.jsx** → `src/pages/`
- Copiar **Survey.jsx** → `src/pages/`
- Reemplazar **App.jsx** con el router

### Paso 4: Ejecutar
```bash
npm run dev
```

### Paso 5: Probar
1. Abre `http://localhost:5173`
2. Deberías ver Landing
3. Click en "Registrar"
4. Completa formulario
5. ¡Deberías ir a Survey!
6. Intenta abrir `/survey` en otra pestaña sin registrarte
7. ¡Debe redirigir a /register!

---

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| No redirige mágicamente | Verifica que `ProtectedRoute` valida `isAuthenticated` |
| Pierde sesión al recargar | Verifica que `useEffect` en `AuthContext` carga desde localStorage |
| No guarda datos | Verifica que `login()` hace `localStorage.setItem()` |
| Email field no valida | Agrega `type="email"` al input |
| Botones no funcionan | Verifica que `onClick` o `type="submit"` están presentes |

---

## 📊 Próximos Pasos

1. **Conectar API real** en `Register.jsx` (cambiar simul)
2. **Agregar validaciones** más robustas
3. **Crear páginas de encuesta** con preguntas reales
4. **Implementar resultados**
5. **Auth tokens** (JWT para producción)
6. **Error handling** mejorado
7. **Estilos CSS** profesionales

---

**¡Listo! Ya tienes el flujo completo. Ahora a implementar. 💪**
