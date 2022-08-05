import {
  FormItem,
  FormItemWithValue,
  FormItemType,
  FormValues,
  ItemIdentifiers,
} from './types'

export const itemHasContent = (
  item: FormItem,
): item is FormItem<FormItemWithValue> => {
  return (
    item.type === FormItemType.ShortText ||
    item.type === FormItemType.Select ||
    item.type === FormItemType.DropdownSelect ||
    item.type === FormItemType.Number ||
    item.type === FormItemType.Checkbox ||
    item.type === FormItemType.Collection
  )
}
export const isCollectionItem = (
  item: FormItem,
): item is FormItem<FormItemType.Collection> => {
  return item.type === FormItemType.Collection
}
export const isGridItem = (
  item: FormItem,
): item is FormItem<FormItemType.Grid> => {
  return item.type === FormItemType.Grid
}

export const getValuesFromItems = <T extends FormItemType>(
  items: FormItem<T>[],
): FormValues<T> => {
  return items.reduce<FormValues>((acc, item): FormValues => {
    if (isGridItem(item)) {
      return {
        ...acc,
        ...getValuesFromItems(item.grid),
      }
    }

    if (!itemHasContent(item)) {
      return acc
    }

    return {
      ...acc,
      [item.id]: item.default,
    }
  }, {})
}

export const getIdsFromItems = (items: FormItem[]): ItemIdentifiers => {
  return items.reduce<ItemIdentifiers>((acc, item) => {
    if (isGridItem(item)) {
      return [...acc, ...item.grid.map((cell) => cell.id)]
    }

    if (!itemHasContent(item)) {
      return acc
    }

    if (isCollectionItem(item)) {
      return [...acc, [item.id, item.template.map((t) => t.id)]]
    }
    return [...acc, item.id]
  }, [])
}
