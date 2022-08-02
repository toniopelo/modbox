import React from 'react'
import {
  FormItem,
  FormItemType,
  FormRenderer,
  CustomFormItemRenderer,
} from '../../types'

export default function FormItemGrid({
  item: gridItem,
  onChange,
  className = '',
  rederer: Renderer,
  customFormItemRenderer,
}: {
  item: FormItem<FormItemType.Grid>
  onChange: (value: FormItem[]) => void
  rederer: FormRenderer
  className?: string
  customFormItemRenderer?: CustomFormItemRenderer
}) {
  return (
    <div className={`${className}`}>
      <Renderer
        items={gridItem.value}
        className="w-full"
        onChange={(subFormItem, response) => {
          const subFormItemIdx = gridItem.value.findIndex(
            (i) => i.id === subFormItem.id,
          )
          if (subFormItemIdx === -1) {
            return
          }

          const updated = [
            ...gridItem.value.slice(0, subFormItemIdx),
            {
              ...gridItem.value[subFormItemIdx],
              value: response,
            },
            ...gridItem.value.slice(subFormItemIdx + 1),
          ] as FormItem[]

          onChange(updated)
        }}
      >
        {customFormItemRenderer}
      </Renderer>
    </div>
  )
}
