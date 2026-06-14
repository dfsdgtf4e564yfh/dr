import { useState } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function useConfirmDialog<T>(handleConfirm: (item: T) => Promise<void>) {
  const [confirmItem, setConfirmItem] = useState<T | null>(null)

  const requestConfirm = (item: T) => setConfirmItem(item)

  const onConfirm = async () => {
    if (confirmItem == null) return
    await handleConfirm(confirmItem)
    setConfirmItem(null)
  }

  const dialogProps: DialogProps = {
    open: confirmItem != null,
    onClose: () => setConfirmItem(null),
    onConfirm,
  }

  return { confirmItem, setConfirmItem, requestConfirm, dialogProps }
}
