import { useContext } from 'react'
import {
  EventWorkspaceRuntimeContext,
  type EventWorkspaceRuntimeValue,
} from '../context/eventWorkspaceRuntimeContext'

export function useOptionalEventWorkspaceRuntime(): EventWorkspaceRuntimeValue | null {
  return useContext(EventWorkspaceRuntimeContext)
}
