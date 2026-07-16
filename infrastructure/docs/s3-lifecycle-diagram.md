# S3 Lifecycle Diagram
# IndiWebPros LMS — Milestone 24

## Lifecycle Rules Flow

```mermaid
flowchart TD
    subgraph Upload["📤 Object Upload"]
        Up["New S3 Object\nWith object-type tag"]
    end

    subgraph Routing["Path-based Routing"]
        Up --> TempCheck{{"Key starts with\ntemp/"}}
        Up --> DraftCheck{{"Key starts with\ndrafts/"}}
        Up --> LogCheck{{"Key starts with\nlogs/"}}
        Up --> CertCheck{{"Key starts with\ncertificates/"}}
        Up --> VideoCheck{{"Key starts with\nlessons/"}}
        Up --> AssetCheck{{"Key starts with\nassets/ or thumbnails/"}}
    end

    subgraph TempLifecycle["🗑️ Temp Files"]
        TempCheck -->|"Yes"| T1["Day 0-6\nSTANDARD class"]
        T1 --> T2["Day 7\n❌ DELETED\nautomatically"]
    end

    subgraph DraftLifecycle["📝 Assignment Drafts"]
        DraftCheck -->|"Yes"| D1["Day 0-29\nSTANDARD class"]
        D1 --> D2["Day 30\n❌ DELETED\nautomatically"]
    end

    subgraph LogLifecycle["📋 Logs"]
        LogCheck -->|"Yes"| L1["Day 0-89\nSTANDARD class"]
        L1 --> L2["Day 90\n→ GLACIER_IR\n~80% cost reduction"]
        L2 --> L3["Day 365\n→ DEEP_ARCHIVE\n~95% cost reduction"]
    end

    subgraph CertLifecycle["🏆 Certificates"]
        CertCheck -->|"Yes"| C1["Day 0-364\nSTANDARD class"]
        C1 --> C2["Day 365\n→ STANDARD_IA\n~40% cost reduction"]
        C2 --> C3["🔒 NEVER DELETED\nPermanent retention"]
    end

    subgraph VideoLifecycle["🎬 Lesson Videos"]
        VideoCheck -->|"Yes"| V1["Day 0-179\nSTANDARD class"]
        V1 --> V2["Day 180\n→ STANDARD_IA\n~40% cost reduction"]
        V2 --> V3["🔒 NEVER DELETED\nPermanent retention"]
    end

    subgraph AssetLifecycle["🖼️ Assets / Thumbnails"]
        AssetCheck -->|"Yes"| A1["Day 0-29\nSTANDARD class"]
        A1 --> A2["Day 30\n→ INTELLIGENT_TIERING\nAuto-optimizes cost"]
    end

    subgraph Multipart["📦 Multipart Uploads"]
        MP["Incomplete Upload\nStarted but not finished"]
        MP --> MP2["Day 7\n❌ ABORTED\nFrees storage"]
    end

    style TempLifecycle fill:#fdecea
    style DraftLifecycle fill:#fef9e7
    style LogLifecycle fill:#eaf4fb
    style CertLifecycle fill:#eafaf1
    style VideoLifecycle fill:#f4ecf7
    style AssetLifecycle fill:#fdfefe
    style Multipart fill:#fdecea
```

---

## S3 Object Prefix Convention

All uploads **must** use these prefixes for lifecycle rules to apply:

| Prefix | Content Type | Lifecycle Rule |
|--------|-------------|---------------|
| `temp/` | Temporary processing files | Delete after 7 days |
| `drafts/` | Assignment drafts, WIP | Delete after 30 days |
| `logs/` | Application/audit logs | Glacier after 90 days → Deep Archive after 365 |
| `certificates/` | Student certificates (PDF) | Keep forever, IA after 1 year |
| `lessons/` | Lesson videos, media | Keep forever, IA after 180 days |
| `thumbnails/` | Course cover images | Intelligent Tiering after 30 days |
| `avatars/` | User profile pictures | Intelligent Tiering after 30 days |
| `assets/` | Static assets (fonts, icons) | Intelligent Tiering after 30 days |

---

## Storage Class Cost Comparison

| Class | Cost/GB/month | Access Cost | Best For |
|-------|--------------|-------------|---------|
| STANDARD | $0.023 | Free | Frequently accessed |
| STANDARD_IA | $0.0125 | $0.01/GB retrieved | Monthly access |
| INTELLIGENT_TIERING | $0.023→auto | Free monitoring | Unknown patterns |
| GLACIER_IR | $0.004 | $0.03/GB retrieved | Quarterly access |
| DEEP_ARCHIVE | $0.00099 | $0.02/GB retrieved | Annual or never |

---

## Versioning Benefits

With versioning enabled:
- Accidental deletes are recoverable (delete marker instead of permanent delete)
- Previous versions kept for rollback
- Object history maintained for compliance

```bash
# Restore accidentally deleted file
aws s3api delete-object \
  --bucket indiwebpros-lms-bucket \
  --key certificates/CERT_ID.pdf \
  --version-id DELETE_MARKER_ID  # removes the delete marker = restores file
```
