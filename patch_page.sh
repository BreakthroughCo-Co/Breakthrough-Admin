sed -i 's/import { ParticipantPortalView } from '\''@\/components\/features\/ParticipantPortalView'\'';/import { ParticipantPortalView } from '\''@\/components\/features\/ParticipantPortalView'\'';\nimport { AIPredictiveInsights } from '\''@\/components\/features\/AIPredictiveInsights'\'';/g' app/page.tsx

sed -i 's/case '\''participant-portal'\'':\n        return <ParticipantPortalView \/>;/case '\''participant-portal'\'':\n        return <ParticipantPortalView \/>;\n      case '\''ai-predictive-insights'\'':\n        return <AIPredictiveInsights \/>;/g' app/page.tsx
