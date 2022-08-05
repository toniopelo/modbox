import { useState } from 'react'

import {
  FormItem,
  FormItemType,
  Response,
  Responses,
  UseFormReturnBase,
} from './types'
import { validateItems } from './validators'

export const MAX_SIZE_RESOLUTION = 12

const updateResponseInSet = <FTypes extends FormItemType>(
  responseMap: Responses<FTypes>,
  itemId: string,
  response: Response<FTypes>,
): Responses<FTypes> => {
  return Object.assign({}, responseMap, { [itemId]: response })
}

const itemHasContent = (
  item: FormItem,
): item is Extract<FormItem, { value: unknown }> => {
  return item.type !== FormItemType.Heading && item.type !== FormItemType.Custom
}
const isCollectionItem = (
  item: FormItem,
): item is Extract<FormItem, { type: FormItemType.Collection }> => {
  return item.type === FormItemType.Collection
}
const isGridItem = (
  item: FormItem,
): item is Extract<FormItem, { type: FormItemType.Grid }> => {
  return item.type === FormItemType.Grid
}

const getResponses = (items: FormItem[]): Responses => {
  return items.reduce<Responses>((acc, item): Responses => {
    if (!itemHasContent(item)) {
      return acc
    }

    if (isGridItem(item)) {
      return {
        ...acc,
        ...getResponses(item.value),
      }
    }

    const responsesToAdd: Responses = {
      [item.id]: isCollectionItem(item)
        ? item.value && item.value.map((v) => getResponses(v))
        : item.value,
    }

    return {
      ...acc,
      ...responsesToAdd,
    }
  }, {})
}

type ItemIdentifiers = (string | [string, string[]])[]
const getIdsFromItems = (items: FormItem[]): ItemIdentifiers => {
  return items.reduce<ItemIdentifiers>((acc, item) => {
    if (!itemHasContent(item)) {
      return acc
    }

    if (isGridItem(item)) {
      return [...acc, ...item.value.map((v) => v.id)]
    }

    if (isCollectionItem(item)) {
      return [
        ...acc,
        item.value ? [item.id, item.template.map((t) => t.id)] : item.id,
      ]
    }

    return [...acc, item.id]
  }, [])
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

const useSyncedResponsesWithItems = (
  items: FormItem[],
): [Responses, (responses: Responses) => void] => {
  const nextItemIds = getIdsFromItems(items)
  const [itemIds, setItemIds] = useState(nextItemIds)
  const [responses, setResponses] = useState(() => getResponses(items))
  const idsToRecompute = getItemsToRecompute(itemIds, nextItemIds)

  if (idsToRecompute.length) {
    const recomputedResponses = getResponses(items)
    const responseToUpdate = idsToRecompute.reduce<Responses>((acc, id) => {
      const identifier = typeof id === 'string' ? id : id[0]
      return Object.assign(acc, {
        [identifier]: recomputedResponses[identifier],
      })
    }, {})

    const updatedResponses = {
      ...responses,
      ...responseToUpdate,
    }
    setResponses(updatedResponses)
    setItemIds(nextItemIds)

    return [updatedResponses, setResponses]
  }

  return [responses, setResponses]
}

export const useForm = ({
  items,
  onChange,
}: {
  items: FormItem<FormItemType>[]
  onChange: (responses: Responses<FormItemType>) => void
}): UseFormReturnBase => {
  const [responses, setResponses] = useSyncedResponsesWithItems(items)

  const isValid = validateItems(items, responses)
  const updateResponses = (responses: Responses<FormItemType>) => {
    setResponses(responses)
    onChange && onChange(responses)
  }

  return {
    items,
    responses,
    isValid,
    clearAll: () => updateResponses(getResponses(items)),
    updateResponse: <FType extends FormItemType>(
      item: FormItem<FType>,
      response: Response<FType>,
    ) => {
      updateResponses(updateResponseInSet(responses, item.id, response))
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
  Response,
  SelectOption,
  UseFormReturnBase,
} from './types'

export { FormLayout } from './components/FormLayout'
