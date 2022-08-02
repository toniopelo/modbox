import React from 'react'
import {
  FormItem,
  CollectionFormItemTypes,
  FormItemType,
  FormRenderer,
  CustomFormItemRenderer,
} from '../../types'

export default function FormItemCollection({
  item: collectionItem,
  onChange,
  rederer: Renderer,
  className = '',
  customFormItemRenderer,
}: {
  item: FormItem<FormItemType.Collection>
  onChange: (collection: FormItem<CollectionFormItemTypes>[][]) => void
  rederer: FormRenderer<CollectionFormItemTypes>
  className?: string
  customFormItemRenderer?: CustomFormItemRenderer
}) {
  return (
    <div
      className={`bg-neutral-100 p-3 rounded-lg border border-gray-300 ${className}`}
    >
      {collectionItem.contextLabel && (
        <div className="h-8 mb-1 flex items-center">
          <div className="w-1 bg-gray-300 rounded-full h-8 mr-2" />
          <span className="text-gray-500">{collectionItem.contextLabel}</span>
        </div>
      )}

      <div>
        <label
          htmlFor={collectionItem.id}
          className="block text-sm mb-4 font-medium text-gray-700"
        >
          {collectionItem.label}
        </label>
        <div className="mt-1">
          {collectionItem.value &&
            collectionItem.value.map((itemGroup, idx) => (
              <div
                key={`item-collection-${collectionItem.id}-groupe-${idx}`}
                className="flex"
              >
                <Renderer
                  items={itemGroup}
                  className="w-full"
                  onChange={(subFormItem, response) => {
                    if (!collectionItem.value) {
                      return
                    }

                    const subFormItemIdx = itemGroup.findIndex(
                      (i) => i.id === subFormItem.id,
                    )
                    if (subFormItemIdx === -1) {
                      return
                    }

                    const updated = [
                      ...itemGroup.slice(0, subFormItemIdx),
                      {
                        ...itemGroup[subFormItemIdx],
                        value: response,
                      },
                      ...itemGroup.slice(subFormItemIdx + 1),
                    ] as FormItem<CollectionFormItemTypes>[]

                    onChange([
                      ...collectionItem.value.slice(0, idx),
                      updated,
                      ...collectionItem.value.slice(idx + 1),
                    ])
                  }}
                >
                  {customFormItemRenderer}
                </Renderer>
                <button
                  type="button"
                  className={`self-end inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ml-3 shrink-0`}
                  onClick={() => {
                    collectionItem.value &&
                      onChange([
                        ...collectionItem.value.slice(0, idx),
                        ...collectionItem.value.slice(idx + 1),
                      ])
                  }}
                >
                  <i className="fa-solid fa-times text-md leading-5" />
                </button>
              </div>
            ))}
          {(!collectionItem.value || collectionItem.value.length === 0) && (
            <div className="mb-4 text-sm text-gray-500">
              {collectionItem.emptyLabel}
            </div>
          )}
          {(collectionItem.value?.length ?? 0) < collectionItem.maxItems && (
            <button
              type="button"
              className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                collectionItem.value?.length ? 'mt-4' : ''
              }`}
              onClick={() => {
                onChange([
                  ...(collectionItem.value ?? []),
                  collectionItem.template.concat(),
                ])
              }}
            >
              <i className="fa-solid fa-plus mr-2" />
              {collectionItem.addLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
