import React from 'react'
import { Fragment } from 'react'

import FormItemCheckbox from '../FormItemCheckbox'
import FormItemCollection from '../FormItemCollection'
import FormItemDropdownSelect from '../FormItemDropdownSelect'
import FormItemNumber from '../FormItemNumber'
import FormItemSelect from '../FormItemSelect'
import FormItemShortText from '../FormItemShortText'
import {
  FormItem,
  FormItemType,
  FormItemSize,
  FormRenderer,
  FormValue,
} from '../../types'
import { MAX_SIZE_RESOLUTION } from '../..'

const SIZES_CLASSNAMES: {
  [k in FormItemSize]: { grid: string; item: string }
} = {
  [1]: { grid: 'grid-cols-1', item: 'col-span-1' },
  [2]: { grid: 'grid-cols-2', item: 'col-span-2' },
  [3]: { grid: 'grid-cols-3', item: 'col-span-3' },
  [4]: { grid: 'grid-cols-4', item: 'col-span-4' },
  [5]: { grid: 'grid-cols-5', item: 'col-span-5' },
  [6]: { grid: 'grid-cols-6', item: 'col-span-6' },
  [7]: { grid: 'grid-cols-7', item: 'col-span-7' },
  [8]: { grid: 'grid-cols-8', item: 'col-span-8' },
  [9]: { grid: 'grid-cols-9', item: 'col-span-9' },
  [10]: { grid: 'grid-cols-10', item: 'col-span-10' },
  [11]: { grid: 'grid-cols-11', item: 'col-span-11' },
  [12]: { grid: 'grid-cols-12', item: 'col-span-12' },
}

export const FormLayout: FormRenderer = ({
  items,
  values,
  onChange,
  className = '',
  sizeResolution = MAX_SIZE_RESOLUTION,
  children: customFormItemRenderer,
}) => {
  const layout = computeLayout(items)
  const gridSizeClassName = SIZES_CLASSNAMES[sizeResolution].grid

  return (
    <div className={`grid ${gridSizeClassName} gap-3 ${className}`}>
      {layout.map((layoutItem, idx) => {
        const size = scaledSize(layoutItem.size, sizeResolution)
        const sizeClassName = SIZES_CLASSNAMES[size].item

        if (layoutItem.type === 'empty') {
          return (
            <div
              key={`empty-layout-item-${idx}`}
              className={`${sizeClassName}`}
            />
          )
        }

        const item = layoutItem.content
        const overlapLabel = item.layout?.overlapLabel ?? false
        const itemClassName = layoutItem.content.layout?.className ?? ''

        if (item.type === FormItemType.Custom) {
          const customRenderer = item.rederer || customFormItemRenderer
          if (!customRenderer) {
            throw new Error(
              'FormItem.Custom encountered but no render function was provided',
            )
          }

          return (
            <div
              key={`custom-item-${idx}`}
              className={`${sizeClassName} ${itemClassName}`}
            >
              {customRenderer(item)}
            </div>
          )
        }

        return (
          <Fragment key={`item-${idx}`}>
            {item.type === FormItemType.Select && (
              <FormItemSelect
                item={item}
                value={values[item.id] as FormValue<FormItemType.Select>}
                onSelect={(value) => onChange(item, value)}
                className={`${sizeClassName} ${itemClassName}`}
              />
            )}
            {item.type === FormItemType.DropdownSelect && (
              <FormItemDropdownSelect
                item={item}
                value={
                  values[item.id] as FormValue<FormItemType.DropdownSelect>
                }
                onSelect={(value) => onChange(item, value)}
                className={`${sizeClassName} ${itemClassName}`}
                overlapLabel={overlapLabel}
              />
            )}
            {item.type === FormItemType.ShortText && (
              <FormItemShortText
                item={item}
                value={values[item.id] as FormValue<FormItemType.ShortText>}
                onChange={(value) => onChange(item, value)}
                className={`${sizeClassName} ${itemClassName}`}
                overlapLabel={overlapLabel}
              />
            )}
            {item.type === FormItemType.Number && (
              <FormItemNumber
                item={item}
                value={values[item.id] as FormValue<FormItemType.Number>}
                onChange={(value) => onChange(item, value)}
                className={`${sizeClassName} ${itemClassName}`}
                overlapLabel={overlapLabel}
              />
            )}
            {item.type === FormItemType.Checkbox && (
              <FormItemCheckbox
                item={item}
                value={values[item.id] as FormValue<FormItemType.Checkbox>}
                onChange={(value) =>
                  onChange<FormItemType.Checkbox>(item, value)
                }
                className={`${sizeClassName} ${itemClassName}`}
              />
            )}
            {item.type === FormItemType.Collection && (
              <FormItemCollection
                item={item}
                value={values[item.id] as FormValue<FormItemType.Collection>}
                onChange={(value) => onChange(item, value)}
                rederer={FormLayout}
                className={`${sizeClassName} ${itemClassName}`}
                customFormItemRenderer={customFormItemRenderer}
              />
            )}
            {item.type === FormItemType.Grid && (
              <FormLayout
                items={item.grid}
                values={values}
                onChange={onChange}
                className={`${sizeClassName} ${itemClassName}`}
              >
                {customFormItemRenderer}
              </FormLayout>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

type LayoutItem<FTypes extends FormItemType> =
  | {
      type: 'content'
      size: FormItemSize
      content: FormItem<FTypes>
    }
  | {
      type: 'empty'
      size: FormItemSize
    }
const computeLayout = <FTypes extends FormItemType>(
  items: FormItem<FTypes>[],
) => {
  const { layout } = items.reduce<{
    layout: LayoutItem<FTypes>[]
    spaceLeftOnRow: FormItemSize
  }>(
    ({ layout, spaceLeftOnRow }, item) => {
      const {
        lastOnRow = false,
        maxSize: maxSizeOption = MAX_SIZE_RESOLUTION,
        minSize = 1,
        firstOnRow = false,
      } = item.layout ?? {}

      if (firstOnRow) {
        return {
          layout: [
            ...layout,
            ...(spaceLeftOnRow > 0 && spaceLeftOnRow < MAX_SIZE_RESOLUTION
              ? [{ size: spaceLeftOnRow, type: 'empty' as const }]
              : []),
            {
              size: maxSizeOption,
              type: 'content' as const,
              content: item,
            },
            ...(lastOnRow && maxSizeOption < MAX_SIZE_RESOLUTION
              ? [
                  {
                    size: (MAX_SIZE_RESOLUTION - maxSizeOption) as FormItemSize,
                    type: 'empty' as const,
                  },
                ]
              : []),
          ],
          spaceLeftOnRow: (lastOnRow
            ? MAX_SIZE_RESOLUTION
            : MAX_SIZE_RESOLUTION - maxSizeOption ||
              MAX_SIZE_RESOLUTION) as FormItemSize,
        }
      }

      const maxSize = Math.max(minSize, maxSizeOption) as FormItemSize
      const realSize =
        maxSize <= spaceLeftOnRow
          ? maxSize
          : minSize <= spaceLeftOnRow
          ? spaceLeftOnRow
          : maxSize
      const spaceLeftOnRowAfter = (
        realSize >= spaceLeftOnRow
          ? MAX_SIZE_RESOLUTION - (realSize > spaceLeftOnRow ? realSize : 0)
          : spaceLeftOnRow - realSize
      ) as FormItemSize

      return {
        layout: [
          ...layout,
          { size: realSize, type: 'content' as const, content: item },
          ...(lastOnRow && spaceLeftOnRowAfter
            ? [{ size: spaceLeftOnRowAfter, type: 'empty' as const }]
            : []),
        ],
        spaceLeftOnRow: lastOnRow ? MAX_SIZE_RESOLUTION : spaceLeftOnRowAfter,
      }
    },
    {
      layout: [] as LayoutItem<FTypes>[],
      spaceLeftOnRow: MAX_SIZE_RESOLUTION,
    },
  )

  return layout
}

const scaledSize = (size: FormItemSize, resolution: FormItemSize) => {
  const ratio = resolution / MAX_SIZE_RESOLUTION
  return Math.round(size * ratio) as FormItemSize
}
