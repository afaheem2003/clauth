'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-4 mb-2 rounded-lg shadow-sm cursor-move border border-gray-200 hover:border-gray-300 transition-colors"
    >
      {children}
    </div>
  )
}

export default function OrganizationAndNotes({ formData, updateFormData }) {
  const [collections, setCollections] = useState(formData.collections || [])
  const [newCollectionName, setNewCollectionName] = useState('')
  const [notes, setNotes] = useState(formData.notes || '')
  const [selectedItems, setSelectedItems] = useState([])

  // Add console log to debug items
  console.log('formData:', formData)
  console.log('items:', formData.items)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleAddCollection = () => {
    if (!newCollectionName.trim()) return

    const newCollection = {
      id: Date.now().toString(),
      name: newCollectionName,
      items: []
    }

    const updatedCollections = [...collections, newCollection]
    setCollections(updatedCollections)
    updateFormData({ collections: updatedCollections })
    setNewCollectionName('')
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      setCollections((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        
        const newCollections = arrayMove(items, oldIndex, newIndex)
        updateFormData({ collections: newCollections })
        return newCollections
      })
    }
  }

  const handleDeleteCollection = (collectionId) => {
    const updatedCollections = collections.filter(c => c.id !== collectionId)
    setCollections(updatedCollections)
    updateFormData({ collections: updatedCollections })
  }

  const handleNotesChange = (e) => {
    const value = e.target.value
    setNotes(value)
    updateFormData({ notes: value })
  }

  const handleItemClick = (itemId) => {
    setSelectedItems(prev => {
      const isSelected = prev.includes(itemId)
      const newSelection = isSelected
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
      return newSelection
    })
  }

  return (
    <div className="space-y-8">
      {/* Collections Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Collections</h3>
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Enter collection name"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-700 text-gray-900"
            />
            <button
              onClick={handleAddCollection}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!newCollectionName.trim()}
            >
              Add Collection
            </button>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={collections.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {collections.map((collection) => (
              <SortableItem key={collection.id} id={collection.id}>
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-medium">{collection.name}</span>
                  <button
                    onClick={() => handleDeleteCollection(collection.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </DndContext>

        {collections.length === 0 && (
          <p className="text-center py-4 text-gray-700 bg-gray-50 rounded-lg">
            No collections yet. Add one to get started!
          </p>
        )}
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Categories</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
            <span className="text-2xl">👕</span>
            <span className="text-gray-900 font-medium">Tops</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
            <span className="text-2xl">👖</span>
            <span className="text-gray-900 font-medium">Bottoms</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
            <span className="text-2xl">🧥</span>
            <span className="text-gray-900 font-medium">Outerwear</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
            <span className="text-2xl">👗</span>
            <span className="text-gray-900 font-medium">Dresses</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
            <span className="text-2xl">👟</span>
            <span className="text-gray-900 font-medium">Shoes</span>
          </button>
          <button className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
            <span className="text-2xl">👜</span>
            <span className="text-gray-900 font-medium">Accessories</span>
          </button>
        </div>
      </div>

      {/* Notes Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Add any notes about your wardrobe..."
          className="w-full h-32 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-700 text-gray-900"
        />
      </div>

      {/* Unorganized Items */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Unorganized Items
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {formData.items
            ?.filter(
              item =>
                !collections.some(collection =>
                  collection.items.some(i => i.id === item.id)
                )
            )
            .map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-all
                  ${
                    selectedItems.includes(item.id)
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
        </div>
      </div>
    </div>
  )
} 