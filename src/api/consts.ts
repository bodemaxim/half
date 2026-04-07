export const enumConfig = {
    users: [
      { value: 'sasha', label: 'Саша' },
      { value: 'max', label: 'Макс' },
    ],
    categories: [
      { value: 'supermarket', label: 'Супермаркет' },
      { value: 'food_delivery', label: 'Доставка еды' },
      { value: 'restaurants', label: 'Рестораны' },
      { value: 'farmacy', label: 'Аптека' },
      { value: 'cosmetics', label: 'Косметика' },
      { value: 'doctors', label: 'Врачи' },
      { value: 'clothes', label: 'Одежда' },
      { value: 'footwear', label: 'Обувь' },
      { value: 'gadgets', label: 'Гаджеты' },
      { value: 'sport', label: 'Спорт' },
      { value: 'entertainment', label: 'Развлечения' },
      { value: 'alcohole', label: 'Алкоголь' },
      { value: 'public_transport', label: 'Общественный транспорт' },
      { value: 'taxi', label: 'Такси' },
      { value: 'furniture', label: 'Мебель' },
      { value: 'household_items', label: 'Товары для дома' },
      { value: 'gifts', label: 'Подарки'},
      { value: 'construction_materials', label: 'Стройматериалы' },
      { value: 'stationery', label: 'Канцелярия' },
      { value: 'close_period', label: 'Закрытие периода' },
      { value: 'other', label: 'Другое' },
      {value: 'unknown', label: 'Неизвестно'}
    ],
    transactionTypes: [
      { value: 'purchase', label: 'Покупка' },
      { value: 'transfer', label: 'Перевод' },
    ],
} as const;
