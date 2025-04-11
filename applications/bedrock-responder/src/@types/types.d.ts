/** Lambda環境 */
interface Env {
  targetEnv: string;
  token: string;
  isLocal: boolean;
}

/** APIのパラメータ */
interface RequestBody {
  userQuery: string;
  type: RequestBodyType;
  token: string;
}

/** 利用ユースケース */
type RequestBodyType = 'question' | 'translation';

/* bedrockのリクエスト*/
interface BedrockRequest {
  toolSpec: object;
  prompt: string;
}

/* bedrockのレスポンス*/
interface BedrockResponse {
  moderationResult?: boolean;
  moderationError?: string;
  prompt?: string;
}
