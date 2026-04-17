# Mbooking: внедрение раздела "Уроки для мастеров"

Документ описывает, как добавить в Mbooking облегченный обучающий модуль (mini-LMS) для мастеров: категории направлений (например, электроэпиляция, косметология) и набор уроков внутри каждого направления.

Цель: повысить ценность подписки, удержание мастеров и LTV продукта без усложнения текущей архитектуры.

---

## 1) Продуктовая идея (как у профессиональных площадок)

### Что добавляем
- Отдельный раздел в owner-интерфейсе: **`/lessons`**.
- Внутри: каталог направлений (например, "Электроэпиляция", "Косметология").
- Внутри направления: список уроков с прогрессом.
- Урок: заголовок, краткое описание, контент (текст + материалы), длительность, уровень, теги.

### Почему это важно
- Подписка становится не только “операционным инструментом”, но и “платформой роста мастера”.
- Повышается удержание: мастер чаще заходит в систему не только ради записей.
- Появляется маркетинговый крючок: "CRM + встроенная обучающая база для специалистов".

### Что делают сильные платформы (и как адаптировать в Mbooking)
- **Четкая структура контента**: направление -> модуль -> урок.
- **Быстрый вход**: понятный каталог, поиск, фильтры.
- **Микро-прогресс**: отмечать просмотренные уроки и показывать % прохождения.
- **Практичность**: короткие уроки 5–15 минут, без перегруженной LMS-логики.
- **Контент под задачи мастера**: техника, частые ошибки, работа с клиентом, безопасность, продажи.

---

## 2) Scope MVP (легко и удобно)

### В MVP включить
- Каталог направлений.
- Список уроков по направлению.
- Экран урока.
- Отметка “просмотрено” + прогресс по направлению.
- Поиск по названию урока/направления.
- Единый доступ ко всем направлениям для любого активного подписчика.

### В MVP не включать
- Платежи за отдельные курсы (можно позже).
- Сложные тесты/сертификаты.
- Видео-хостинг внутри backend (использовать ссылки/внешний CDN).

### Политика доступа (важно)
- Любой мастер с активной подпиской получает доступ ко всему каталогу уроков.
- Ограничение по специализации не применяется: электролог может смотреть косметологию, и наоборот.
- Без активной подписки доступ к урокам (metadata + video playback) закрыт.

---

## 3) UX/CX модель для Mbooking

## Основной путь пользователя
1. Мастер открывает `Уроки` в меню.
2. Выбирает направление (`Электроэпиляция`, `Косметология`).
3. Видит уроки: базовые, продвинутые, чеклисты, ошибки.
4. Открывает урок и изучает материал.
5. Нажимает “Отметить как изучено”.
6. Возвращается в каталог и видит прогресс.

## UI-принципы
- Лаконичная сетка карточек (как в текущем UI стиле).
- Быстрый контент без лишних кликов.
- Единая навигация с текущими разделами (`receptions`, `charts`, `recommendations`).

---

## 4) Архитектура данных (Backend / Prisma)

Рекомендуемая модель для MVP:

- `LessonTrack` — направление обучения  
  Примеры: "Электроэпиляция", "Косметология"
- `Lesson` — конкретный урок внутри направления
- `LessonProgress` — прогресс конкретного owner по конкретному уроку

### Предлагаемые сущности

```prisma
model LessonTrack {
  id          String   @id @default(uuid())
  slug        String   @unique
  title       String
  description String?
  sortOrder   Int      @default(0)
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  lessons     Lesson[]
}

model Lesson {
  id            String   @id @default(uuid())
  trackId       String
  track         LessonTrack @relation(fields: [trackId], references: [id], onDelete: Cascade)
  slug          String   @unique
  title         String
  shortDescription String?
  contentMd     String   // markdown-контент
  durationMin   Int?
  level         String?  // beginner/intermediate/advanced
  tags          String[] // для быстрого поиска/фильтра
  sortOrder     Int      @default(0)
  isPublished   Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  progresses LessonProgress[]

  @@index([trackId, sortOrder])
}

model LessonProgress {
  id          String   @id @default(uuid())
  ownerUserId String
  lessonId    String
  isCompleted Boolean  @default(false)
  completedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  owner  User   @relation(fields: [ownerUserId], references: [id], onDelete: Cascade)

  @@unique([ownerUserId, lessonId])
  @@index([ownerUserId, isCompleted])
}
```

---

## 5) Backend реализация (`backend`)

## 5.1 Новый модуль

Создать модуль: `backend/src/modules/lessons/`

Структура:
- `lessons.module.ts`
- `lessons.controller.ts`
- `lessons.service.ts`
- `dto/`
  - `list-lessons.query.dto.ts`
  - `complete-lesson.dto.ts`
- `lessons.types.ts`

Подключить `LessonsModule` в `backend/src/app.module.ts`.

## 5.2 API контракты (owner protected)

Все роуты под `JwtAuthGuard + OwnerRoleGuard`.

- `GET /v1/lessons/tracks`  
  Возвращает опубликованные направления + агрегированный прогресс owner.

- `GET /v1/lessons/tracks/:trackSlug`  
  Детали направления.

- `GET /v1/lessons`  
  Query: `track`, `search`, `level`, `completed`, `page`, `limit`.

- `GET /v1/lessons/:slug`  
  Детали урока + статус прогресса owner.

- `POST /v1/lessons/:id/complete`  
  Ставит урок как `completed`.

- `POST /v1/lessons/:id/uncomplete`  
  Снимает отметку “изучено”.

## 5.3 Admin контент-операции (этап 2)

Пока можно не выводить в UI, но заложить API:
- `POST /v1/admin/lesson-tracks`
- `PATCH /v1/admin/lesson-tracks/:id`
- `POST /v1/admin/lessons`
- `PATCH /v1/admin/lessons/:id`

Доступ: отдельный guard (например, owner + env-флаг + allowlist).

## 5.4 Валидация и безопасность

- `class-validator` для DTO.
- Rate-limit на публичные endpoints не нужен (все owner protected).
- Проверка `isPublished = true` для пользовательской выдачи.
- Санитизация markdown -> HTML на frontend (или рендер через безопасный markdown).

## 5.5 Seed-данные для быстрого старта

Добавить initial seed:
- Трек: Электроэпиляция (5-10 уроков).
- Трек: Косметология (5-10 уроков).

Контент хранить в markdown-файлах и импортировать в seed.

## 5.6 Видео-инфраструктура только на РФ сервисах (рекомендуется Яндекс Cloud)

Цель: видео видит только авторизованный пользователь с активной подпиской.

### Базовая архитектура (РФ-only)
- **Yandex Object Storage**: хранение видео и HLS-сегментов.
- **Yandex Cloud CDN**: ускорение доставки видео.
- **Yandex Compute Cloud**: backend/Nest + фоновая обработка.
- **Managed Service for PostgreSQL**: основная БД приложения.
- **Yandex Container Registry + Docker**: сборка/деплой backend.
- **Yandex Lockbox**: хранение секретов.

### Как выдавать доступ к видео
1. Клиент запрашивает `GET /v1/lessons/:slug/playback`.
2. Backend проверяет:
   - валидную owner-сессию;
   - статус подписки (активна/не активна).
3. Если доступ есть, backend выдает **короткоживущий signed URL** (например, 1-5 минут) на m3u8/сегменты.
4. Плеер загружает видео по временному URL.

### Почему это лучше, чем прямые ссылки
- Без подписки URL не получить.
- Даже если URL утек, он быстро протухает.
- Не нужно вручную добавлять пользователей, как в private YouTube.

### Минимальный технический стандарт
- Хранить видео в HLS (`.m3u8` + `.ts`/`.m4s`), а не один mp4.
- Отключить публичный листинг бакета.
- Вести audit-логи выдачи playback URL (кто/когда/какой урок).
- Ограничить частоту выдачи playback endpoint через throttler.

---

## 6) Frontend реализация (`app`, `components`, `src/api`, `src/hooks`)

## 6.1 Страницы в `app`

Добавить:
- `app/lessons/page.tsx` — каталог направлений + общий поиск.
- `app/lessons/[track]/page.tsx` — уроки выбранного направления.
- `app/lessons/[track]/[lesson]/page.tsx` — просмотр урока.

## 6.2 Компоненты в `components`

Новые feature-компоненты:
- `components/Lessons/TrackCard.tsx`
- `components/Lessons/LessonCard.tsx`
- `components/Lessons/LessonFilters.tsx`
- `components/Lessons/LessonProgressBar.tsx`
- `components/Lessons/LessonContent.tsx`

## 6.3 API слой (`src/api`)

Добавить:
- `src/api/lessons.api.ts`  
  По текущему паттерну `nestOwnerFetch`, аналогично `services.api.ts`.

Методы:
- `fetchLessonTracks()`
- `fetchLessons(params)`
- `fetchLessonBySlug(slug)`
- `completeLesson(id)`
- `uncompleteLesson(id)`

## 6.4 Hooks (`src/hooks`)

Добавить:
- `src/hooks/lessons.hooks.ts`  
  По паттерну TanStack Query (`useLessons`, `useLessonTracks`, `useCompleteLesson`, ...).

Добавить query key namespace:
- `["lessons", ...]`
- `["lessonTracks"]`

## 6.5 Навигация

В `components/Navbar/index.tsx` добавить пункт:
- `Уроки` -> `/lessons`

## 6.6 UX-детали

- В карточке трека:
  - название;
  - количество уроков;
  - прогресс (например, 4/12).
- В карточке урока:
  - уровень, длительность, теги;
  - статус изучения.
- На экране урока:
  - кнопки "Отметить как изучено"/"Снять отметку".

---

## 7) Пошаговый план внедрения

## Этап A — Backend foundation
1. Добавить Prisma модели + миграцию.
2. Сгенерировать Prisma client.
3. Создать `LessonsModule` (controller/service/dto/types).
4. Реализовать owner read APIs + complete/uncomplete APIs.
5. Добавить seed-данные по двум направлениям.

**Definition of Done:**
- API возвращает треки и уроки;
- прогресс меняется и сохраняется по owner.

## Этап B — Frontend MVP
1. Добавить `src/api/lessons.api.ts`.
2. Добавить `src/hooks/lessons.hooks.ts`.
3. Добавить страницы `app/lessons*`.
4. Добавить базовые компоненты каталога/урока.
5. Добавить пункт в navbar.

**Definition of Done:**
- мастер может открыть уроки, выбрать направление, открыть урок, отметить изучение.

## Этап C — Полировка
1. Поиск и фильтры (уровень/статус).
2. Пустые состояния и skeletons.
3. Оптимистичное обновление прогресса.
4. Мелкая аналитика (нажатия, completion rate).

**Definition of Done:**
- UX быстрый и понятный, без "мертвых экранов".

## Этап D — Профессиональные улучшения (после MVP)
1. Learning paths: "Новичок -> Практик -> Профи".
2. Мини-тесты после уроков.
3. Бейджи/достижения.
4. Контент-рекомендации по профилю мастера.
5. Платные “премиум-модули” как апселл к подписке.

---

## 8) Монетизация и бизнес-логика

Рекомендованная модель:
- База уроков включена в подписку (повышает конверсию в оплату и retention).
- Премиум-уроки/треки как Upsell (`Pro Education Pack`).
- В будущем: тарифы "Starter / Pro / Academy".

Продуктовая гипотеза:
- "Мастера, которые изучили >= 3 уроков в первый месяц, имеют выше retention и выше ARPU."

---

## 9) Технические риски и решения

- **Риск:** сложный контент-редактор.  
  **Решение:** начать с markdown и seed/import.

- **Риск:** тяжёлые видео.  
  **Решение:** хранить видео в Yandex Object Storage + CDN, отдавать через signed URL.

- **Риск:** перегруженный UX.  
  **Решение:** MVP с 3 экранами, без LMS-перегруза.

- **Риск:** неочевидная ценность уроков.  
  **Решение:** сделать практичные треки и вшить в онбординг.

---

## 10) Что делать прямо сейчас (чеклист)

1. Утвердить Prisma-схему (`LessonTrack`, `Lesson`, `LessonProgress`).
2. Создать backend module `lessons`.
3. Реализовать 6 owner API эндпоинтов (tracks/list/detail/complete/uncomplete).
4. Добавить seed контент для 2 направлений.
5. Создать 3 страницы в `app/lessons`.
6. Добавить `lessons.api.ts` и `lessons.hooks.ts`.
7. Добавить пункт `Уроки` в navbar.
8. Протестировать полный user flow.
9. Поднять Yandex Object Storage + CDN и подключить signed playback endpoint.

---

## 11) Критерии успеха фичи

Через 30 дней после релиза измерить:
- `% owner, посетивших раздел Lessons`;
- `% owner, завершивших >= 1 урок`;
- среднее число уроков на активного owner;
- влияние на 30-дневный retention;
- конверсию в более высокий тариф (если добавлен upsell).

