
# Belediye Atık Yönetimi Backend API

Bu repository, **Belediye Atık Yönetimi Sistemi** için geliştirilen backend servislerini içerir. Proje; belediye yöneticilerinin, çavuşların, şoförlerin, şirketlerin ve vatandaşların atık yönetimi süreçlerini dijital ortamda takip edebilmesi amacıyla hazırlanmıştır.

Sistem; konteyner yönetimi, araç ve şoför takibi, atık toplama kayıtları, vatandaş şikayetleri, fotoğraf yükleme, geri dönüşüm talepleri ve yönetici paneli işlemlerini REST API yapısı ile sunar.

---

## Kullanılan Teknolojiler

| Teknoloji | Açıklama |
|---|---|
| Node.js | Backend çalışma ortamı |
| Express.js | REST API geliştirme |
| PostgreSQL | Veritabanı |
| pg | PostgreSQL bağlantısı |
| bcrypt | Şifre hashleme |
| jsonwebtoken | JWT tabanlı kimlik doğrulama |
| multer | Fotoğraf yükleme |
| dotenv | Ortam değişkenleri |
| cors | CORS yönetimi |
| nodemon | Geliştirme ortamı |

---

## Temel Özellikler

- Rol bazlı giriş sistemi
- JWT ile güvenli kimlik doğrulama
- Yönetici paneli için özet veriler
- Mahalle, konteyner, araç ve şoför yönetimi
- Çavuş bazlı sorumluluk alanı yönetimi
- Şoförler için atık toplama kaydı oluşturma
- Vatandaş şikayeti oluşturma
- Şikayetlere fotoğraf ekleme
- Şirketler için geri dönüşüm talebi oluşturma
- Admin tarafından şikayet ve talep durumlarını güncelleme
- PostgreSQL tabanlı ilişkisel veritabanı yapısı

---

## Roller

| Rol | Yetki |
|---|---|
| Admin | Tüm sistem verilerini görüntüler, şikayetleri ve talepleri yönetir |
| Çavuş | Kendi mahallesindeki konteyner, araç ve şoförleri yönetir |
| Şoför | Kendi aracının türüne uygun konteynerler için toplama kaydı oluşturur |
| Şirket | Geri dönüşüm talebi oluşturur ve kendi taleplerini takip eder |
| Vatandaş | Konteynerlerle ilgili şikayet oluşturur |

---



