# ModalContext - Guía de Uso

El `ModalContext` permite centralizar la lógica del modal en toda la aplicación. Ya no necesitas repetir el código de estado del modal en cada componente.

## Estructura

- **ModalContext.jsx**: Define el contexto y el provider
- **GlobalModal**: Componente que renderiza el modal basado en el estado del contexto
- **useModal()**: Hook personalizado para acceder al contexto

## Cómo Usar

### 1. Verificar que el App.jsx tenga ModalProvider envolviendo la aplicación ✓

El App.jsx ya está configurado con:
```jsx
<AuthProvider>
  <ModalProvider>
    {/* resto de la app */}
    <GlobalModal />
  </ModalProvider>
</AuthProvider>
```

### 2. En cualquier componente, importar y usar el hook

```jsx
import { useModal } from '../../contexts/ModalContext';

const MiComponente = () => {
  const { openModal } = useModal();

  const handleClick = () => {
    // Abrir un modal simple
    openModal(
      "Título del Modal",
      "Contenido del modal"
    );
  };

  const handleClickConConfirmacion = () => {
    // Abrir un modal con callback de confirmación
    openModal(
      "¿Estás seguro?",
      "Esta acción no se puede deshacer",
      () => {
        // Esta función se ejecuta cuando el usuario hace click en "Entendido"
        console.log("El usuario confirmó");
        // Aquí van tus acciones
      }
    );
  };

  return (
    <>
      <button onClick={handleClick}>Abrir Modal Simple</button>
      <button onClick={handleClickConConfirmacion}>Abrir Modal con Confirmación</button>
    </>
  );
};

export default MiComponente;
```

## API del Contexto

### useModal()

Devuelve un objeto con las siguientes propiedades y métodos:

#### `openModal(title, body, onConfirm)`
Abre el modal con los parámetros especificados.

**Parámetros:**
- `title` (string): Título del modal
- `body` (string): Contenido del modal
- `onConfirm` (function, opcional): Función callback que se ejecuta al hacer click en "Entendido"

**Ejemplo:**
```jsx
openModal(
  "Operación completada",
  "Los datos se han guardado exitosamente",
  () => {
    console.log("Confirmado por el usuario");
  }
);
```

#### `closeModal()`
Cierra el modal manualmente.

**Ejemplo:**
```jsx
const { closeModal } = useModal();
closeModal();
```

#### `modalState`
Estado actual del modal (lectura avanzada).

**Propiedades:**
- `show`: boolean - Si el modal está visible
- `title`: string - Título actual del modal
- `body`: string - Contenido del modal
- `onConfirm`: function - Callback de confirmación

## Ejemplo Completo

```jsx
import { useModal } from '../../contexts/ModalContext';
import { useState } from 'react';
import { Button } from 'react-bootstrap';

const MiComponente = () => {
  const { openModal } = useModal();
  const [data, setData] = useState(null);

  const handleGuardar = async () => {
    try {
      // Simular guardado
      setData({ success: true });
      
      openModal(
        "Éxito",
        "Los datos se han guardado correctamente",
        () => {
          // Acciones post-confirmación
          console.log("Redireccionando...");
        }
      );
    } catch (error) {
      openModal(
        "Error",
        `Hubo un error: ${error.message}`
      );
    }
  };

  return (
    <Button onClick={handleGuardar} variant="primary">
      Guardar
    </Button>
  );
};

export default MiComponente;
```

## Ventajas

✅ **Reutilizable**: Usa el mismo modal en todos los componentes
✅ **Centralizado**: Un único punto de control
✅ **Limpio**: Menos código en componentes individuales
✅ **Consistente**: Interfaz uniforme en toda la aplicación
✅ **Fácil de mantener**: Cambios en un solo lugar

