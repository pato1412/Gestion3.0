import React from 'react'
import Sidebar from '../../components/Sidebar/Sidebar'
import { useDeposito } from '../../contexts/DepositoContext';

const NewOrder = () => {
  const { DepositoId, Deposito } = useDeposito();
  
  return (
    <>
        <Sidebar title="Nuevo Pedido" />
        <div>NuevoPedido</div>
        <div>DepositoId: {DepositoId}</div>
        <div>Deposito: {JSON.stringify(Deposito)}</div>
    </>
  )
}

export default NewOrder