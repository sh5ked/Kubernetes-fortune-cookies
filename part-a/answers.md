# Kubernetes Basics – תשובות לתרגילים

מסמך זה מרכז את התשובות לשאלות בתרגילי Pod, ReplicaSet, Deployment, ClusterIP ו־NodePort.

## 1. Pod

**Pod** הוא יחידת ההרצה הקטנה ביותר ב־Kubernetes. הוא מכיל קונטיינר אחד או יותר, שמשתפים את סביבת הרשת ויכולים לשתף אחסון.

בדיקת Pods:

```bash
kubectl get pods
kubectl describe pod web-pod
```

מחיקת Pod מסוים:

```bash
kubectl delete pod web-pod
```

מחיקת כל ה־Pods ב־Namespace הנוכחי:

```bash
kubectl delete pods --all
```

אם Pod מנוהל על ידי Deployment או ReplicaSet, הבקר עשוי ליצור Pod חלופי כדי לשמור על מספר העותקים שהוגדר. Pod עצמאי, שאינו מנוהל על ידי בקר, לא ייווצר מחדש באופן אוטומטי לאחר מחיקתו.

## 2. ReplicaSet

**ReplicaSet** אחראי לשמור על מספר ה־Pods הרצוי שתואמים ל־Label Selector שלו.

בתרגיל הזה, `web-rs` מבקש שלושה Pods עם התווית `app: web-rs`.

### מה קורה אם יוצרים ידנית Pod נוסף עם אותה תווית?

ה־ReplicaSet סופר גם את ה־Pod הידני כחלק מה־Pods שתואמים ל־Selector שלו. אם מספר ה־Pods התואמים גדול ממספר ה־Replicas שהוגדר, ה־ReplicaSet ינסה להחזיר את המספר לכמות הרצויה. Kubernetes לא מבטיח שדווקא ה־Pod הידני יהיה זה שיימחק.

### מה קורה אם משנים את ה־Image בתבנית של ReplicaSet?

השינוי בתבנית משפיע על Pods שייווצרו בעתיד. Pods קיימים לא מוחלפים אוטומטית רק מפני שתבנית ה־ReplicaSet השתנתה. בדרך כלל משתמשים ב־Deployment כדי לבצע עדכוני אפליקציה מבוקרים ו־Rollouts.

## 3. Deployment

**Deployment** מנהל ReplicaSets ומאפשר להגדיר ולבצע עדכונים לאפליקציה. הוא תומך ב־Rolling Updates וב־Rollbacks.

בתרגיל הזה, ה־Deployment מבקש שלושה Nginx Pods ומשתמש באסטרטגיית `RollingUpdate`:

- `maxSurge: 1` מאפשר ליצור Pod נוסף אחד לכל היותר מעבר למספר ה־Replicas הרצוי בזמן העדכון.
- `maxUnavailable: 0` מגדיר שלא תהיה ירידה מכוונת במספר ה־Replicas הזמינים מתחת למספר הרצוי במהלך העדכון.

להחלת שינויים לאחר עדכון קובץ YAML:

```bash
kubectl apply -f deployment.yaml
kubectl rollout status deployment/web
```

לצפייה בהיסטוריית העדכונים ולביטול העדכון האחרון:

```bash
kubectl rollout history deployment/web
kubectl rollout undo deployment/web
```

## 4. שירות מסוג ClusterIP

### איך Service יודע לאילו Pods להעביר תעבורה?

Service משתמש ב־`selector` כדי למצוא Pods עם Labels תואמים. Kubernetes מפרסם את כתובות ה־IP של ה־Pods המתאימים והזמינים כיעדים של השירות. בגרסאות Kubernetes מודרניות היעדים מנוהלים באמצעות EndpointSlices.

לדוגמה, `selector: app: web` בוחר Pods שיש להם את התווית `app: web`.

### מה הראו ה־Endpoints לאחר שהגדלנו את ה־Deployment לחמישה Replicas?

כאשר כל חמשת ה־Pods שתאמו ל־Selector היו מוכנים, השירות הציג חמישה Endpoints — כתובת לכל Pod שיכול לקבל תעבורה.

### מה קרה כאשר שינינו את ה־Selector ל־`app: wbe`, ולמה הבקשה נכשלה?

לא היו Pods עם התווית השגויה `app: wbe`, ולכן לשירות לא היו Endpoints מתאימים. ה־Pods עצמם המשיכו לפעול, אבל ל־Service לא היה Pod שאליו הוא יכול להעביר את הבקשה. לכן הבקשות דרך השירות נכשלו או הסתיימו ב־Timeout.

### האם אפשר לגשת ישירות ל־ClusterIP מהדפדפן במחשב האישי? למה?

בדרך כלל לא. כתובת ClusterIP מיועדת לתקשורת פנימית בתוך האשכול, ובדרך כלל נגישה רק מתוך רשת האשכול. כדי לגשת לשירות באופן זמני מהמחשב המקומי אפשר להשתמש ב־Port Forward:

```bash
kubectl port-forward svc/web-svc 8080:80
```

לאחר מכן פותחים בדפדפן את הכתובת `http://localhost:8080`.

## 5. שירות מסוג NodePort

### מה מייצגים `port`, `targetPort` ו־`nodePort`?

| שדה | מה הוא מייצג? | איפה הוא פועל? |
|---|---|---|
| `port` | הפורט שבו ה־Service מקבל בקשות מתוך האשכול | ב־Service |
| `targetPort` | הפורט של ה־Pod שאליו מועברת התעבורה | ביעד הרשת של ה־Pod או הקונטיינר |
| `nodePort` | הפורט שדרכו ניתן להגיע לשירות באמצעות כתובת של Node | ב־Node, באמצעות מנגנוני הרשת של Kubernetes |

בתרגיל הזה זרימת התעבורה היא:

`Browser -> NodeIP:30080 -> Service port 80 -> Pod targetPort 80`

### מהו טווח ברירת המחדל של NodePort?

טווח ברירת המחדל ב־Kubernetes הוא **30000–32767**. ניתן לשנות אותו באמצעות הפרמטר `--service-node-port-range` של Kubernetes API Server.

ב־K3s אפשר לבדוק אם הוגדר טווח מותאם אישית בהגדרות השרת ובפרמטרים של השירות. לדוגמה:

```bash
sudo grep -R "service-node-port-range" /etc/rancher/k3s/ /etc/systemd/system/k3s.service* 2>/dev/null
```

אם לא הוגדר טווח אחר, Kubernetes משתמש בטווח ברירת המחדל. הפקודה `kubectl get svc` מציגה את ה־NodePort שהוקצה לשירות מסוים, אך אינה מציגה בפני עצמה את כל הטווח המותר.

### האם Service מסוג NodePort מקבל גם ClusterIP?

כן. Service מסוג `NodePort` מקבל גם כתובת `ClusterIP`. לכן אפשר לגשת אליו מתוך האשכול באמצעות כתובת השירות, וגם דרך ה־NodePort מבחוץ — בכפוף להגדרות הרשת וחומת האש.

### מתי נבחר ב־ClusterIP ומתי ב־NodePort?

- **ClusterIP:** נבחר בו כאשר צריך תקשורת פנימית בתוך האשכול, למשל בין שירות Backend למסד נתונים. זהו סוג השירות הרגיל והנפוץ לתקשורת פנימית.
- **NodePort:** נבחר בו כאשר רוצים לאפשר גישה לשירות דרך פורט ב־Node, למשל כדי לפתוח את Nginx בדפדפן במהלך תרגיל או לצורך חשיפה פשוטה מבחוץ.

בסביבות Production משתמשים לעיתים קרובות גם ב־Ingress או ב־Service מסוג `LoadBalancer` לחשיפת אפליקציות, בהתאם לתשתית ולארכיטקטורה.

## 6. פקודות שימושיות לבדיקה

```bash
kubectl get pods -o wide
kubectl get deployments
kubectl get replicasets
kubectl get services
kubectl get endpoints web-svc
kubectl get endpointslices -l kubernetes.io/service-name=web-svc
kubectl describe svc web-svc
```

> הערה: ממשק ה־API הישן `Endpoints` הוכרז כ־Deprecated בגרסאות Kubernetes חדשות. כיום מומלץ להשתמש ב־EndpointSlices, אך הפקודה `kubectl get endpoints` עדיין שימושית לתרגיל הזה.
