---
phase: 3
title: Fix due review flow
status: completed
priority: P2
effort: 45m
dependencies:
  - '1'
---

# Phase 3: Fix due review flow

## Overview

Sửa nút "Ôn tập từ đến hạn" ở `/vocabulary/review`: hiện tại load due vocab vào store rồi navigate — nhưng study page luôn hiện picker khi không có URL params nên due vocab bị bỏ. Sửa thành một đường load duy nhất qua URL param `due=1`, vào thẳng flashcard.

## Requirements

- Functional: bấm nút → `/vocabulary/study?mode=flashcard&due=1` → vào thẳng flashcard với ~20 từ due; header hiện "Từ đến hạn (N)"; nút "Đổi bài" về picker vẫn chạy.
- Non-functional: một đường load duy nhất qua URL (pattern restore có sẵn), tránh double-fetch; không đổi backend.

## Architecture

Tái dùng đúng pattern restore-from-URL hiện có của `vocabulary-study-page.tsx` (effect đọc `searchParams` rồi gọi 1 action load). Thêm nhánh `due=1`:

```
review-dashboard  --navigate('/vocabulary/study?mode=flashcard&due=1')-->  study page
study page effect: searchParams có due=1 → loadDueVocabularies(20)  (thay loadByHSKLevel)
header: due mode → "Từ đến hạn (vocabularies.length)" thay tên level/scope
handleBackToStart: setSearchParams({}) → về picker (không đổi)
```

Bỏ `loadDueVocabularies` + `setStudyMode` gọi trước navigate trong dashboard (nguyên nhân double-load cũ).

## Related Code Files

- Modify: `frontend/src/pages/vocabulary/review-dashboard-page.tsx`, `frontend/src/pages/vocabulary/vocabulary-study-page.tsx`
- Đọc tham khảo: `frontend/src/stores/vocabulary-store.ts` (`loadDueVocabularies` — dữ liệu due đã được normalize sẵn để khớp type `Vocabulary`), `frontend/src/components/vocabulary/stats-card.tsx` (nút review chỉ hiện khi `dueToday > 0`)

## Implementation Steps

1. `vocabulary-study-page.tsx`:
   - Effect restore: nhánh `searchParams.get('due') === '1'` → `loadDueVocabularies(20)`; các nhánh level/lesson giữ nguyên.
   - Header study screen: khi `due=1` hiện `t('vocabulary.study.dueTitle', { count: vocabularies.length })` thay `selectedHsk?.name` + tiêu đề scope.
2. i18n 3 locale: thêm `vocabulary.study.dueTitle` — vi: "Từ đến hạn ({{count}} từ)", en: "Due words ({{count}})", zh: "到期单词（{{count}} 个）".
3. `review-dashboard-page.tsx`: `handleStartReview` chỉ còn `navigate('/vocabulary/study?mode=flashcard&due=1')`; bỏ import `loadDueVocabularies`, `setStudyMode` nếu không còn chỗ dùng.
4. Build pass; test tay: seed vài từ đến hạn (hoặc dùng user thật có due) → bấm nút → vào thẳng flashcard; rating 1 từ → due giảm; "Đổi bài" → về picker.

## Success Criteria

- [ ] Nút "Ôn tập từ đến hạn" vào thẳng flashcard due, không qua picker.
- [ ] Không double-fetch (chỉ 1 GET `/vocabulary/progress/due` khi vào).
- [ ] "Đổi bài" về picker bình thường; learning mode level/bài không bị ảnh hưởng.
- [ ] Build pass.

## Risk Assessment

Thấp. Lưu ý 1: `loadDueVocabularies` trả dataset nhỏ normalized (`lessonId: ''`...) — chỉ dùng cho flashcard, không cho quiz theo level; do đó URL `due=1` chỉ hợp lệ với `mode=flashcard` — dashboard luôn set mode flashcard trong URL, study page bỏ qua `due` khi `mode != flashcard`. Lưu ý 2: user chưa có từ nào do học SM-2 → `dueToday = 0` → nút không hiện (đã là hành vi hiện có, giữ nguyên).
