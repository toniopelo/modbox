import { useState } from 'react'

import {
  FormItem,
  FormItemType,
  FormValue,
  FormValues,
  ItemIdentifiers,
  UseFormReturnBase,
} from './types'
import { getIdsFromItems, getValuesFromItems } from './utils'
import { validateItems } from './validators'

export const MAX_SIZE_RESOLUTION = 12

const updateValueInSet = <FTypes extends FormItemType>(
  valueMap: FormValues<FTypes>,
  itemId: string,
  value: FormValue<FTypes>,
): FormValues<FTypes> => {
  return Object.assign({}, valueMap, { [itemId]: value })
}

const getItemsToRecompute = (
  previousItemIds: ItemIdentifiers,
  nextItemIds: ItemIdentifiers,
) => {
  return nextItemIds.reduce<ItemIdentifiers>((acc, nextId) => {
    // Searching the perfect match for this identifier
    const perfectMatch = previousItemIds.find(
      (prevId) =>
        // Test if these two identifier are from regular items and have the same id
        prevId === nextId ||
        // Else, check if both of these identifiers are collection identifiers,
        // If they are, they should have matching id and children
        (Array.isArray(prevId) &&
          Array.isArray(nextId) &&
          prevId[0] === nextId[0] &&
          nextId[1].every((subId) => prevId[1].includes(subId))),
    )

    if (!perfectMatch) {
      return acc.concat(nextId)
    }
    return acc
  }, [])
}

const useSyncedValuesWithItems = (
  items: FormItem[],
): [FormValues, (values: FormValues) => void] => {
  const nextItemIds = getIdsFromItems(items)
  const [itemIds, setItemIds] = useState(nextItemIds)
  const [values, setValues] = useState(() => getValuesFromItems(items))
  const idsToRecompute = getItemsToRecompute(itemIds, nextItemIds)

  if (idsToRecompute.length) {
    const recomputedValues = getValuesFromItems(items)
    const valueToUpdate = idsToRecompute.reduce<FormValues>((acc, id) => {
      const identifier = typeof id === 'string' ? id : id[0]
      return Object.assign(acc, {
        [identifier]: recomputedValues[identifier],
      })
    }, {})

    const updatedValues = {
      ...values,
      ...valueToUpdate,
    }
    setValues(updatedValues)
    setItemIds(nextItemIds)

    return [updatedValues, setValues]
  }

  return [values, setValues]
}

export const useForm = ({
  items,
  onChange,
}: {
  items: FormItem<FormItemType>[]
  onChange: (values: FormValues<FormItemType>) => void
}): UseFormReturnBase => {
  const [values, setValues] = useSyncedValuesWithItems(items)

  const isValid = validateItems(items, values)
  const updateValues = (values: FormValues<FormItemType>) => {
    setValues(values)
    onChange && onChange(values)
  }

  return {
    items,
    values,
    isValid,
    clearAll: () => updateValues(getValuesFromItems(items)),
    updateValue: <FType extends FormItemType>(
      item: FormItem<FType>,
      value: FormValue<FType>,
    ) => {
      updateValues(updateValueInSet(values, item.id, value))
    },
  }
}

export {
  FormItem,
  FormItemType,
  CollectionFormItemTypes,
  CustomFormItemRenderer,
  FormItemSize,
  FormRenderer,
  FormValue,
  FormValues,
  SelectOption,
  UseFormReturnBase,
} from './types'

export { FormLayout } from './components/FormLayout'
