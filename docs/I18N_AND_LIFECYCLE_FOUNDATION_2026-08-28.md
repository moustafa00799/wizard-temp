# I18n and Lifecycle Foundation — 2026-08-28

## النطاق

تضيف هذه الدفعة أساسًا قابلًا للتوسع لدعم **العربية والإنجليزية** في Local Staging، وتصل تفضيل اللغة من بداية Wizard إلى payload التوليد. التغيير لغوي/عرضي فقط؛ لا يغير دلالات `CanonicalWizardInput` ولا سلطة **CDKS** ولا بنية **Canonical Blueprint**.

يظل الافتراضي هو العربية (`ar`) مع اتجاه `rtl`، بينما تستخدم الإنجليزية (`en`) اتجاه `ltr`. يتم حفظ التفضيل ضمن مسودة Wizard في Store، ويمكن تغييره من خطوة البداية.

## قرارات التنفيذ

| المجال | القرار |
|---|---|
| مصدر اللغة | `DataModel.locale` في Store مع default `ar` |
| القاموس | `src/lib/i18n.ts` يحوي `AppLocale`، الاتجاه، صيغ Intl، وقواميس العرض الأولية |
| انتقال اللغة | `buildWizardGenerationPayload` يمرر `locale` ضمن payload، و`buildBlueprintContractV3` يدعم أصلًا `ar|en` |
| autofill | `preserveWizardConsent` يحافظ على locale الحالي بدل استبداله بلغة fixture |
| AI | لا توجد ترجمة AI runtime ولا إضافة claims؛ AI الاستشاري يظل optional وadvisory-only |
| lifecycle | هوية الدور تأتي من session الموقعة؛ لا يثق الخادم بـ`actor_user_id` لتحديد صلاحية العضوية |

## إصلاح Lifecycle

كان الانتقال البشري من واجهة Review يرسل `actor_type: user` دون `actor_user_id`، وهو صحيح أمنيًا لأن الهوية يجب أن تستخرج من الجلسة. لكن فحص عضوية مساحة العمل كان يستخدم القيمة الاختيارية القادمة من الطلب، فكان يرفض الطلب برسالة `Human lifecycle transitions require actor_user_id.`.

أصبح فحص العضوية يعتمد على `session.userId`. ما يزال الخادم يرفض صراحةً أي `actor_user_id` يرسله العميل إذا كان مختلفًا عن هوية الجلسة. ويُسجل الانتقال داخليًا باستخدام هوية الجلسة، مع بقاء `approved` حالة مراجعة/تحضير فقط، وليس تفويضًا للنشر أو الإنفاق.

## التحقق

- `npx tsc --noEmit` — ناجح.
- `npm run test:campaign:lifecycle:http` — ناجح، 42 assertion، ويتضمن omission وmismatch.
- `npm run test:wizard:review:consent` — ناجح، 81 assertion، ويتضمن حفظ locale الإنجليزية.
- `npm run test:autofill:fixtures` — ناجح، 10 profiles بلا تكرار داخل shuffled bag.
- `npm run test:blueprint:display` — ناجح، مع استمرار حجب renderer source وتبسيط unavailable وإخفاء RF IDs.

## الحدود المقصودة

هذه الدفعة لا تترجم بعد كل renderer أو كل خطوة Wizard. سيتم ذلك على دفعات لاحقة باستخدام القاموس المركزي، مع عدم ترجمة القيم التي أدخلها العميل أو raw keys الحاكمة. كما لا تضيف أي صلاحية مزود أو نشر أو إنفاق أو Market Validation.

## English implementation note

This change introduces a persisted Arabic/English presentation preference for Local Staging. It is intentionally presentation-only: CDKS and the Canonical Blueprint remain the sole decision authority. Lifecycle authorization now derives workspace membership from the signed session, while an explicitly supplied mismatched actor identity remains forbidden.
