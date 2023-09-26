import React from 'react'
import {
  FormItem,
  CollectionFormItemTypes,
  FormItemType,
  FormRenderer,
  CustomFormItemRenderer,
  FormValue,
} from '../../types'
import { getValuesFromItems } from '../../utils'

export default function FormItemCollection({
  item: collectionItem,
  value,
  onChange,
  rederer: Renderer,
  className = '',
  customFormItemRenderer,
}: {
  item: FormItem<FormItemType.Collection>
  value: FormValue<FormItemType.Collection>
  onChange: (collection: FormValue<FormItemType.Collection>) => void
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
          {value &&
            value.map((rowValues, idx) => (
              <div
                key={`item-collection-${collectionItem.id}-group-${idx}`}
                className="flex"
              >
                <Renderer
                  items={collectionItem.template}
                  values={rowValues}
                  className={`w-full ${collectionItem.rowGridClassName ?? ''}`}
                  onChange={(subFormItem, subValue) => {
                    // Exit if no row exists, this should not happen
                    if (!value) {
                      return
                    }

                    // Replace row by updated one
                    onChange([
                      ...(value.slice(0, idx) ?? []),
                      {
                        ...rowValues,
                        [subFormItem.id]: subValue,
                      },
                      ...(value.slice(idx + 1) ?? []),
                    ])
                  }}
                >
                  {customFormItemRenderer}
                </Renderer>
                <button
                  type="button"
                  className={`self-end inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ml-3 shrink-0`}
                  onClick={() => {
                    value &&
                      onChange([
                        ...value.slice(0, idx),
                        ...value.slice(idx + 1),
                      ])
                  }}
                >
                  <i className="fa-solid fa-times text-md leading-5" />
                </button>
              </div>
            ))}
          {(value?.length ?? 0) === 0 && (
            <div className="mb-4 text-sm text-gray-500">
              {collectionItem.emptyLabel}
            </div>
          )}
          {(value?.length ?? 0) < collectionItem.maxItems && (
            <button
              type="button"
              className={`inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                value?.length ? 'mt-4' : ''
              }`}
              onClick={() => {
                onChange([
                  ...(value ?? []),
                  getValuesFromItems(collectionItem.template),
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
