import { createContext, useContext } from 'react'

export const NotificationContext = createContext(null)
export const ReservasContext = createContext(null)
export const useNotification = () => useContext(NotificationContext).notify
export const useReservas = () => useContext(ReservasContext)
