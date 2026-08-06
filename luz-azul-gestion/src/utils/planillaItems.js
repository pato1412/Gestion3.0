export const getErrorMessage = (error) => {
  if (!error) return 'Error inesperado'
  if (typeof error === 'string') return error
  if (error.message) return error.message

  try {
    return JSON.stringify(error)
  } catch {
    return 'Error inesperado'
  }
}

export const mapProductosToPlanillaOptions = (productos) => {
  if (!Array.isArray(productos)) return []

  return productos.map((producto) => ({
    ProductoId: producto.ProductoId,
    Descripcion: producto.Descripcion,
    StockActual: 0,
    Cantidades: [],
    CantidadContada: 0
  }))
}

export const upsertItemCantidad = (prevItems, productoSeleccionado, cantidad) => {
  const existingItem = prevItems.find((item) => item.ProductoId === productoSeleccionado.ProductoId)

  if (!existingItem) {
    return [
      ...prevItems,
      {
        ...productoSeleccionado,
        Cantidades: [cantidad],
        CantidadContada: cantidad
      }
    ]
  }

  const nuevasCantidades = [...existingItem.Cantidades, cantidad]
  return prevItems.map((item) => {
    if (item.ProductoId !== productoSeleccionado.ProductoId) return item

    return {
      ...item,
      Cantidades: nuevasCantidades,
      CantidadContada: nuevasCantidades.reduce((total, cant) => total + cant, 0)
    }
  })
}

export const removeItemOrLastCantidad = (prevItems, item) => {
  const isLastQuantity = item.Cantidades.length === 1

  if (isLastQuantity) {
    return prevItems.filter((current) => current.ProductoId !== item.ProductoId)
  }

  return prevItems.map((current) => {
    if (current.ProductoId !== item.ProductoId) return current

    const nuevasCantidades = current.Cantidades.slice(0, -1)
    return {
      ...current,
      Cantidades: nuevasCantidades,
      CantidadContada: nuevasCantidades.reduce((total, cantidad) => total + cantidad, 0)
    }
  })
}

export const filterPlanillaItems = (items, searchTerm) => {
  const term = searchTerm.trim().toLowerCase()
  if (!term) return items

  return items.filter((item) => {
    return item.ProductoId.toString().includes(term) || item.Descripcion.toLowerCase().includes(term)
  })
}
