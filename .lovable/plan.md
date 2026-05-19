# خطة بناء منصة SDMATH

مشروع كبير متعدد الأقسام. سأبنيه على مراحل متتابعة بعد موافقتك، مع تفعيل Lovable Cloud كقاعدة بيانات وتخزين ومصادقة.

## الهوية البصرية
- ألوان: تركواز عميق `#0E7C7B` + أبيض + أخضر داكن `#0A4F4E` (مأخوذ من الشعار) + لمسات رمادية أنيقة
- خط عربي: **Tajawal** أو **IBM Plex Sans Arabic** (نظيف، قريب من Apple/Notion)
- دعم RTL كامل عبر `dir="rtl"` على `<html>`
- حركات: Framer Motion ناعمة (fade/slide قصيرة)
- الشعار يظهر في الهيدر بكل الصفحات

## التقنيات
- TanStack Start (React) + Tailwind v4 — الموجود في القالب
- **Lovable Cloud** للقاعدة والتخزين والمصادقة (بديل Firebase/Supabase الذي طلبته — أبسط وبدون إعداد)
- Framer Motion للحركات
- jsPDF + qrcode لإصدار الشهادات PDF مع QR

## بنية قاعدة البيانات
```
profiles        (id, name, whatsapp, coach_name, membership_no, status: pending|approved|rejected, level)
exams           (id, title, description, level, total_time, allow_back, created_at)
questions       (id, exam_id, image_url, correct_answer, marks, time_limit, order, group_no)
attempts        (id, exam_id, user_id, started_at, finished_at, score, total_time)
answers         (id, attempt_id, question_id, given_answer, is_correct, time_spent)
certificates    (id, attempt_id, cert_number, issued_at, qr_code)
admins          (مصادقة منفصلة بكلمة المرور المحددة)
```
RLS مفعّل: المشترك يرى بياناته فقط، الأدمن يرى الكل.

## بنية الصفحات (Routes)
**عام:**
- `/` — الرئيسية (شعار + عنوان + زرّا اشتراك/دخول)
- `/register` — نموذج الاشتراك
- `/login` — دخول المشترك (اسم + رقم عضوية)

**المشترك (محمي):**
- `/exams` — قائمة الاختبارات المتاحة
- `/exams/$id` — صفحة بدء الاختبار
- `/exams/$id/take` — واجهة السؤال الواحد مع المؤقتين
- `/exams/$id/result` — النتيجة بعد الانتهاء

**الإدارة:**
- `/admin/login` — دخول (SDMATH / 2386831)
- `/admin` — Dashboard إحصائيات
- `/admin/members` — جدول المشتركين (قبول/رفض/حذف)
- `/admin/exams` — قائمة الاختبارات (نسخ رابط، تعديل، حذف، مشاركة)
- `/admin/exams/new` — إنشاء اختبار + رفع أسئلة (صور + إجابات + مجموعات)
- `/admin/exams/$id/preview` — معاينة كما يراها المشترك
- `/admin/analytics` — تحليلات ورسوم بيانية (Recharts)
- `/admin/results/$attemptId` — نتيجة الطالب + زر "موافقة وإصدار شهادة"
- `/certificate/$certNumber` — صفحة عامة للتحقق من الشهادة عبر QR

## مراحل التنفيذ (سأقترح تنفيذها على دفعات لتفادي الأخطاء)

**المرحلة 1 — الأساس والهوية**
- تفعيل Lovable Cloud
- نظام التصميم (ألوان، خطوط، RTL، شعار)
- الصفحة الرئيسية + Register + Login المشترك

**المرحلة 2 — قاعدة البيانات + المصادقة**
- جداول profiles, exams, questions, attempts, answers, certificates
- سياسات RLS
- ربط نموذج الاشتراك + تسجيل الدخول بحالات Pending/Approved/Rejected

**المرحلة 3 — لوحة الإدارة**
- دخول الإدارة
- Dashboard + جدول المشتركين (قبول/رفض)

**المرحلة 4 — إنشاء الاختبارات**
- نموذج إنشاء اختبار
- رفع صور الأسئلة (Storage)
- تقسيم لمجموعات

**المرحلة 5 — تجربة المشترك للاختبار**
- عرض سؤال واحد + مؤقتان
- منع الرجوع (اختياري)
- حفظ الإجابات + حساب النتيجة

**المرحلة 6 — التحليلات والشهادات**
- صفحة التحليلات + رسوم بيانية
- إصدار شهادة PDF مع QR ورقم فريد
- صفحة التحقق العامة

## ملاحظات
- المصادقة: المشترك يدخل بـ "الاسم + رقم العضوية" كما طلبت (سأبنيها كـ lookup مباشر في `profiles` بدل auth.users التقليدي — أبسط للمستخدم النهائي). كلمة مرور الأدمن محفوظة Hash في `admins`.
- اللوغو الذي رفعته سأنسخه إلى `src/assets/sdmath-logo.png` ويستخدم في كل الصفحات.
- التوسعات المستقبلية (بطولات، دفع، تطبيق) سأترك البنية مرنة لكن لن أبنيها الآن.

هل أبدأ بالمرحلة 1 + 2 معاً (الأساس + قاعدة البيانات)؟ أو تفضل تنفيذ كل المراحل دفعة واحدة (أطول لكن مشروع كامل جاهز)؟