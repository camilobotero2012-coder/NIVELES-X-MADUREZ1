# 🧩 Componentes Reutilizables y Patrones

## 1️⃣ Custom Hooks

### useAuth Hook

```javascript
// hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe usarse dentro de SessionProvider');
  }
  
  return context;
}

// Uso en componentes:
function MiComponente() {
  const { session, isAuthenticated, login, logout } = useAuth();
  
  if (isAuthenticated) {
    return <div>Bienvenido {session.userName}</div>;
  }
}
```

### useSessionGuard Hook

```javascript
// hooks/useSessionGuard.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

export function useSessionGuard(redirectTo = '/register') {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(redirectTo, { 
        replace: true,
        state: { message: 'Primero debes registrar tu empresa' }
      });
    }
  }, [isAuthenticated, navigate, redirectTo]);
  
  return isAuthenticated;
}

// Uso:
function SurveyPage() {
  const isValid = useSessionGuard();
  
  if (!isValid) return null;
  
  return <div>Encuesta...</div>;
}
```

### useFormValidation Hook

```javascript
// hooks/useFormValidation.js
import { useState, useCallback } from 'react';

export function useFormValidation(initialValues, validate, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validar mientras escribe (opcional)
    if (touched[name]) {
      const fieldError = validate(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: fieldError
      }));
    }
  }, [touched, validate]);
  
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const fieldError = validate(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: fieldError
    }));
  }, [validate]);
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit]);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setErrors
  };
}

// Uso:
function RegisterForm() {
  const validationRules = {
    nombreEmpresa: (value) => {
      if (!value) return 'Requerido';
      if (value.length < 3) return 'Mínimo 3 caracteres';
      return null;
    },
    email: (value) => {
      if (!value) return 'Requerido';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
      return null;
    }
  };
  
  const form = useFormValidation(
    { nombreEmpresa: '', email: '' },
    (field, value) => validationRules[field]?.(value),
    async (values) => {
      // Guardar en base de datos
      await registerCompany(values);
    }
  );
  
  return (
    <form onSubmit={form.handleSubmit}>
      <input
        name="nombreEmpresa"
        value={form.values.nombreEmpresa}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
      />
      {form.touched.nombreEmpresa && form.errors.nombreEmpresa && (
        <span className="error">{form.errors.nombreEmpresa}</span>
      )}
      
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Registrando...' : 'Registrar'}
      </button>
    </form>
  );
}
```

---

## 2️⃣ Componentes Reutilizables

### FormField Component

```javascript
// components/FormField.jsx
export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required,
  options // Para selects
}) {
  return (
    <div className="form-field">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      
      {type === 'select' ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={touched && error ? 'error' : ''}
        >
          <option value="">Selecciona...</option>
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={touched && error ? 'error' : ''}
        />
      )}
      
      {touched && error && (
        <p className="error-message">{error}</p>
      )}
    </div>
  );
}

// Uso:
<FormField
  label="Nombre de empresa"
  name="nombreEmpresa"
  value={form.values.nombreEmpresa}
  onChange={form.handleChange}
  onBlur={form.handleBlur}
  error={form.errors.nombreEmpresa}
  touched={form.touched.nombreEmpresa}
  required
/>
```

### Button Component

```javascript
// components/Button.jsx
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  className = ''
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size} ${className}`}
    >
      {loading ? (
        <>
          <span className="spinner"></span>
          Cargando...
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Uso:
<Button
  type="submit"
  variant="primary"
  loading={isSubmitting}
>
  Registrar empresa
</Button>
```

### Message Alert Component

```javascript
// components/Message.jsx
import { useEffect, useState } from 'react';

export default function Message({
  type = 'info', // 'info', 'success', 'error', 'warning'
  message,
  onClose,
  duration = 5000,
  closeable = true
}) {
  const [visible, setVisible] = useState(!!message);
  
  useEffect(() => {
    if (!message) return;
    
    setVisible(true);
    
    if (duration) {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);
  
  if (!visible || !message) return null;
  
  return (
    <div className={`message message-${type}`}>
      <p>{message}</p>
      {closeable && (
        <button
          className="close-btn"
          onClick={() => {
            setVisible(false);
            onClose?.();
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// Uso:
const [message, setMessage] = useState('');
const [messageType, setMessageType] = useState('info');

return (
  <>
    <Message
      type={messageType}
      message={message}
      onClose={() => setMessage('')}
    />
  </>
);
```

### Card Component

```javascript
// components/Card.jsx
export default function Card({
  title,
  subtitle,
  children,
  footer,
  highlighted = false
}) {
  return (
    <div className={`card ${highlighted ? 'card-highlighted' : ''}`}>
      {title && (
        <div className="card-header">
          <h3>{title}</h3>
          {subtitle && <p className="subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="card-body">
        {children}
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
}
```

---

## 3️⃣ Context Provider Completo

```javascript
// context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';

export const AuthContext = createContext();

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicializar desde localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedSession = localStorage.getItem('session');
        
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          
          // Validar que tenga propiedades requeridas
          if (parsedSession.companyId && parsedSession.userId) {
            setSession(parsedSession);
            setIsAuthenticated(true);
          } else {
            // Sesión corrupta
            localStorage.removeItem('session');
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error('Error inicializando auth:', err);
        localStorage.removeItem('session');
        setError('Error al cargar sesión');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const login = useCallback((sessionData) => {
    try {
      // Agregar timestamp de creación
      const enrichedSession = {
        ...sessionData,
        loginAt: new Date().toISOString()
      };
      
      localStorage.setItem('session', JSON.stringify(enrichedSession));
      setSession(enrichedSession);
      setIsAuthenticated(true);
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Error al hacer login:', err);
      setError('Error al guardar sesión');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('session');
      setSession(null);
      setIsAuthenticated(false);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error al hacer logout:', err);
      setError('Error al cerrar sesión');
      return false;
    }
  }, []);

  const updateSession = useCallback((updates) => {
    try {
      const updatedSession = { ...session, ...updates };
      localStorage.setItem('session', JSON.stringify(updatedSession));
      setSession(updatedSession);
      return true;
    } catch (err) {
      console.error('Error al actualizar sesión:', err);
      setError('Error al actualizar sesión');
      return false;
    }
  }, [session]);

  const value = {
    session,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 4️⃣ Servicios API

### companyService.js

```javascript
// services/companyService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const companyService = {
  register: async (companyData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(companyData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en companyService.register:', error);
      throw error;
    }
  },

  getCompanyInfo: async (companyId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en companyService.getCompanyInfo:', error);
      throw error;
    }
  }
};
```

### surveyService.js

```javascript
// services/surveyService.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const surveyService = {
  getSurveyQuestions: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/survey/questions`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en surveyService.getSurveyQuestions:', error);
      throw error;
    }
  },

  saveResponse: async (companyId, userId, questionId, answer) => {
    try {
      const response = await fetch(`${API_BASE_URL}/survey/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: companyId,
          user_id: userId,
          question_id: questionId,
          answer: answer
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en surveyService.saveResponse:', error);
      throw error;
    }
  },

  getResults: async (companyId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/survey/results?company_id=${companyId}`
      );
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en surveyService.getResults:', error);
      throw error;
    }
  }
};
```

---

## 5️⃣ Utils - Helpers

### validators.js

```javascript
// utils/validators.js

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^\+?[\d\s\-()]+$/;
export const NAME_REGEX = /^[a-zA-Z\s\-áéíóúñ]+$/;
export const COMPANY_NAME_REGEX = /^[a-zA-Z0-9\s\-&.,áéíóúñ]+$/;

export function validateEmail(email) {
  return EMAIL_REGEX.test(email);
}

export function validateName(name) {
  return name.length >= 3 && name.length <= 100 && NAME_REGEX.test(name);
}

export function validateCompanyName(name) {
  return name.length >= 3 && name.length <= 255 && COMPANY_NAME_REGEX.test(name);
}

export function validateForm(data, rules) {
  const errors = {};
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    if (rule.required && (!value || value.trim() === '')) {
      errors[field] = `${rule.label || field} es requerido`;
      continue;
    }
    
    if (rule.validator && value) {
      const error = rule.validator(value);
      if (error) {
        errors[field] = error;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
```

### storage.js

```javascript
// utils/storage.js

const STORAGE_KEYS = {
  SESSION: 'session',
  COMPANY: 'company_data',
  SURVEY_PROGRESS: 'survey_progress'
};

export const storage = {
  setSession(session) {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      return true;
    } catch (err) {
      console.error('Error saving session:', err);
      return false;
    }
  },

  getSession() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Error reading session:', err);
      return null;
    }
  },

  clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      return true;
    } catch (err) {
      console.error('Error clearing session:', err);
      return false;
    }
  },

  setSurveyProgress(companyId, progress) {
    try {
      const key = `${STORAGE_KEYS.SURVEY_PROGRESS}_${companyId}`;
      localStorage.setItem(key, JSON.stringify(progress));
      return true;
    } catch (err) {
      console.error('Error saving progress:', err);
      return false;
    }
  },

  getSurveyProgress(companyId) {
    try {
      const key = `${STORAGE_KEYS.SURVEY_PROGRESS}_${companyId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('Error reading progress:', err);
      return null;
    }
  }
};
```

### constants.js

```javascript
// utils/constants.js

export const INDUSTRIES = [
  { value: 'Technology', label: '💻 Tecnología' },
  { value: 'Finance', label: '💰 Finanzas' },
  { value: 'Healthcare', label: '🏥 Salud' },
  { value: 'Retail', label: '🛍️ Retail' },
  { value: 'Manufacturing', label: '🏭 Manufactura' },
  { value: 'Education', label: '📚 Educación' },
  { value: 'Telecommunications', label: '📱 Telecomunicaciones' },
  { value: 'Energy', label: '⚡ Energía' },
  { value: 'Other', label: '🔧 Otro' }
];

export const COMPANY_SIZES = [
  { value: 'small', label: 'Pequeña (1-50 empleados)' },
  { value: 'medium', label: 'Mediana (51-250 empleados)' },
  { value: 'large', label: 'Grande (251-1000 empleados)' },
  { value: 'enterprise', label: 'Empresa (+1000 empleados)' }
];

export const COUNTRIES = [
  { value: 'Mexico', label: '🇲🇽 México' },
  { value: 'Colombia', label: '🇨🇴 Colombia' },
  { value: 'Argentina', label: '🇦🇷 Argentina' },
  { value: 'Spain', label: '🇪🇸 España' },
  // ... más países
];

export const MATURITY_LEVELS = {
  0: 'No iniciado',
  1: 'Inicial',
  2: 'En desarrollo',
  3: 'Establecido',
  4: 'Optimizado',
  5: 'Maduro'
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet',
  SERVER_ERROR: 'Error del servidor. Intenta más tarde',
  INVALID_EMAIL: 'Email inválido',
  INVALID_FORM: 'Completa todos los campos requeridos',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor registrate',
  REGISTER_REQUIRED: 'Primero debes registrar tu empresa'
};

export const SUCCESS_MESSAGES = {
  REGISTER_SUCCESS: '¡Bienvenido! Tu empresa ha sido registrada',
  SURVEY_PROGRESS_SAVED: 'Progreso guardado',
  SURVEY_COMPLETED: '¡Encuesta completada!'
};
```

---

## 6️⃣ Estructura de Carpetas Completa

```
proyecto-encuesta/
├── src/
│   ├── components/
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── FormField.jsx
│   │   ├── Message.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Register.jsx
│   │   ├── Survey.jsx
│   │   └── Results.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useSessionGuard.js
│   │   └── useFormValidation.js
│   ├── services/
│   │   ├── companyService.js
│   │   ├── surveyService.js
│   │   └── api.js
│   ├── utils/
│   │   ├── validators.js
│   │   ├── storage.js
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── styles/
│   │   ├── global.css
│   │   ├── components.css
│   │   ├── pages.css
│   │   └── theme.css
│   ├── App.jsx
│   └── index.jsx
├── public/
├── package.json
└── .env
```

---

**¡Con esta estructura tienes todo listo para implementar! 🎯**
