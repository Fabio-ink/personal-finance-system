import React, { useState, useEffect } from 'react';
import { useCrud } from '../hooks/useCrud';
import { useSelection } from '../hooks/useSelection';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import Input from '../components/ui/Input';
import Checkbox from '../components/ui/Checkbox';
import { useTranslation } from 'react-i18next';

function CategoriesPage() {
  const { t } = useTranslation();
  const { items: categories, loading, error, addItem, updateItem, deleteMultipleItems, fetchItems } = useCrud('/categories');
  const [name, setName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  
  const { selectedItems: selectedCategories, handleSelect, handleSelectAll, clearSelection, isAllSelected } = useSelection(categories);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const categoryData = { name };

    if (editingCategory) {
      await updateItem(editingCategory.id, categoryData);
    } else {
      await addItem(categoryData);
    }

    setName('');
    setEditingCategory(null);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setName(category.name);
  };

  const handleDeleteSelected = async () => {
    await deleteMultipleItems(Array.from(selectedCategories));
    clearSelection();
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setName('');
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <PageTitle>{t('categories.title')}</PageTitle>
        {selectedCategories.size > 0 && (
            <Button 
                variant="danger"
                onClick={handleDeleteSelected}>
                {t('common.delete')} ({selectedCategories.size})
            </Button>
        )}
      </div>

      <Card as="form" onSubmit={handleSubmit} className="mb-8 p-4">
        <div className="flex items-end gap-4">
          <div className="grow">
            <Input
              id="category-name"
              label={t('categories.name')}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('categories.placeholderName')}
              required
            />
          </div>
          <Button type="submit" variant="primary" className="h-10">
            {editingCategory ? t('common.update') : t('common.save')}
          </Button>
          {editingCategory && (
            <Button onClick={cancelEdit} type="button" variant="ghost" className="h-10">
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </Card>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="space-y-3">
          {categories.length > 0 ? (
            <>
                <div className="flex items-center p-3">
                    <Checkbox id="selectAllCategories" checked={isAllSelected} onChange={handleSelectAll} label={t('planning.selectAll')}/>
                </div>
                {categories.map(cat => (
                  <Card key={cat.id} className={`flex justify-between items-center p-3 ${selectedCategories.has(cat.id) ? 'bg-blue-100 dark:bg-blue-900' : ''}`}>
                    <div className="flex items-center">
                        <Checkbox id={`category-${cat.id}`} checked={selectedCategories.has(cat.id)} onChange={() => handleSelect(cat.id)} />
                        <span className="font-semibold text-gray-800 dark:text-gray-200 ml-2">{t(`categories.${cat.name.toLowerCase()}`, cat.name)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={() => handleEdit(cat)} variant="warning" size="sm">{t('common.edit')}</Button>
                    </div>
                  </Card>
                ))}
            </>
          ) : (
            <Card className="text-center p-6">
              <p className="text-gray-500 dark:text-gray-400">{t('categories.noCategories')}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default CategoriesPage;