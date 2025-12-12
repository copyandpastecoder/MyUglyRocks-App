'use client';

import { useState, useCallback, useMemo } from 'react';

/**
 * State and handlers for a single modal
 */
interface ModalState<T = undefined> {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Data associated with the modal (e.g., item being edited) */
  data: T | null;
  /** Open the modal, optionally with data */
  open: (data?: T) => void;
  /** Close the modal and clear data */
  close: () => void;
  /** Toggle the modal state */
  toggle: () => void;
}

/**
 * Hook for managing a single modal's open/close state with optional data.
 *
 * @example
 * ```tsx
 * const editModal = useModalState<User>();
 *
 * // Open with data
 * <Button onClick={() => editModal.open(user)}>Edit</Button>
 *
 * // In dialog
 * <Dialog open={editModal.isOpen} onOpenChange={editModal.close}>
 *   <DialogContent>
 *     <EditForm user={editModal.data} />
 *   </DialogContent>
 * </Dialog>
 * ```
 */
export function useModalState<T = undefined>(): ModalState<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((newData?: T) => {
    setData(newData ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Clear data after a short delay to prevent UI flicker during close animation
    setTimeout(() => setData(null), 200);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Memoize return object to maintain referential stability
  return useMemo(
    () => ({ isOpen, data, open, close, toggle }),
    [isOpen, data, open, close, toggle]
  );
}

/**
 * Type-safe modal keys configuration
 */
type ModalConfig<TModals extends Record<string, unknown>> = {
  [K in keyof TModals]: TModals[K];
};

/**
 * Hook for managing multiple modals with type-safe data.
 * Reduces state explosion when a component needs multiple dialogs.
 *
 * @example
 * ```tsx
 * // Define modal types
 * type Modals = {
 *   create: undefined;
 *   edit: User;
 *   delete: User;
 *   view: User;
 * };
 *
 * const modals = useModalStates<Modals>(['create', 'edit', 'delete', 'view']);
 *
 * // Open edit modal with data
 * <Button onClick={() => modals.edit.open(user)}>Edit</Button>
 *
 * // Check if any modal is open
 * const isAnyOpen = modals.isAnyOpen();
 *
 * // Close all modals
 * modals.closeAll();
 * ```
 */
export function useModalStates<TModals extends Record<string, unknown>>(
  keys: (keyof TModals)[]
): {
  [K in keyof TModals]: ModalState<TModals[K]>;
} & {
  isAnyOpen: () => boolean;
  closeAll: () => void;
} {
  // Create state for all modals
  const [openStates, setOpenStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(keys.map((k) => [k, false]))
  );
  const [dataStates, setDataStates] = useState<Record<string, unknown>>(
    () => Object.fromEntries(keys.map((k) => [k, null]))
  );

  // Create handlers for each modal
  // Note: Handlers are recreated when state changes, which is necessary
  // since they need access to current isOpen/data values
  const modalHandlers: Record<string, ModalState<unknown>> = {};

  keys.forEach((key) => {
    const keyStr = key as string;

    modalHandlers[keyStr] = {
      isOpen: openStates[keyStr] ?? false,
      data: dataStates[keyStr] ?? null,
      open: (data?: unknown) => {
        setDataStates((prev) => ({ ...prev, [keyStr]: data ?? null }));
        setOpenStates((prev) => ({ ...prev, [keyStr]: true }));
      },
      close: () => {
        setOpenStates((prev) => ({ ...prev, [keyStr]: false }));
        setTimeout(() => {
          setDataStates((prev) => ({ ...prev, [keyStr]: null }));
        }, 200);
      },
      toggle: () => {
        setOpenStates((prev) => ({ ...prev, [keyStr]: !prev[keyStr] }));
      },
    };
  });

  // Utility functions
  const isAnyOpen = useCallback(() => {
    return Object.values(openStates).some(Boolean);
  }, [openStates]);

  const closeAll = useCallback(() => {
    setOpenStates(Object.fromEntries(keys.map((k) => [k, false])));
    setTimeout(() => {
      setDataStates(Object.fromEntries(keys.map((k) => [k, null])));
    }, 200);
  }, [keys]);

  return {
    ...modalHandlers,
    isAnyOpen,
    closeAll,
  } as {
    [K in keyof TModals]: ModalState<TModals[K]>;
  } & {
    isAnyOpen: () => boolean;
    closeAll: () => void;
  };
}

/**
 * Simple hook for confirmation dialogs (delete, archive, etc.)
 * Returns state and handlers for the confirm dialog pattern.
 *
 * @example
 * ```tsx
 * const { confirmState, requestConfirm, handleConfirm, handleCancel } = useConfirmDialog<string>();
 *
 * // Request confirmation
 * <Button onClick={() => requestConfirm(item.id)}>Delete</Button>
 *
 * // In AlertDialog
 * <AlertDialog open={confirmState.isOpen}>
 *   <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
 *   <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
 * </AlertDialog>
 * ```
 */
export function useConfirmDialog<T = string>(
  onConfirm: (data: T) => void | Promise<void>
) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestConfirm = useCallback((confirmData: T) => {
    setData(confirmData);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (data === null) return;

    setIsLoading(true);
    try {
      await onConfirm(data);
      setIsOpen(false);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [data, onConfirm]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return {
    confirmState: { isOpen, data, isLoading },
    requestConfirm,
    handleConfirm,
    handleCancel,
  };
}
