export type UiActionType =
    | "wait"
    | "screenshot"
    | "tapTag"
    | "textTag"
    | "pressBack";

export type UiAction = {
    type: UiActionType;
    ms?: number;
    screenKey?: string;
    tag?: string;
    value?: string;
};

export type UiScreen = {
    screenKey: string;
    label: string;
    baselineUrl?: string;
    threshold: number;
};

export type UiRunnerConfig = {
    requiredFiles: string[];
    entryFiles: string[];
    buildCommand: string;
    runCommand: string;
    deviceProfiles: string[];
    screenshotTargets: string[];
    scenarioId?: string;
    scenarioName?: string;
    uiScreens: UiScreen[];
    uiActions: UiAction[];
};

export const EMPTY_RUNNER_CONFIG: UiRunnerConfig = {
    requiredFiles: [],
    entryFiles: [],
    buildCommand: "",
    runCommand: "",
    deviceProfiles: [],
    screenshotTargets: [],
    scenarioId: "",
    scenarioName: "",
    uiScreens: [],
    uiActions: [],
};

export const UI_SCENARIO_TEMPLATES: UiRunnerConfig[] = [
    {
        ...EMPTY_RUNNER_CONFIG,
        scenarioId: "form-list-detail",
        scenarioName: "Form nhập liệu + danh sách + chi tiết",
        uiScreens: [
            {
                screenKey: "ui-01-form",
                label: "Màn hình form nhập liệu",
                threshold: 70,
            },
            {
                screenKey: "ui-02-list",
                label: "Màn hình danh sách",
                threshold: 70,
            },
            {
                screenKey: "ui-03-detail",
                label: "Màn hình chi tiết",
                threshold: 70,
            },
        ],
        uiActions: [
            {
                type: "wait",
                ms: 2500,
            },
            {
                type: "screenshot",
                screenKey: "ui-01-form",
            },
            {
                type: "textTag",
                tag: "input-food-name",
                value: "Pho bo",
            },
            {
                type: "textTag",
                tag: "input-food-description",
                value: "Mon an Viet Nam",
            },
            {
                type: "textTag",
                tag: "input-food-price",
                value: "50000",
            },
            {
                type: "tapTag",
                tag: "btn-submit-food",
            },
            {
                type: "wait",
                ms: 1500,
            },
            {
                type: "screenshot",
                screenKey: "ui-02-list",
            },
            {
                type: "tapTag",
                tag: "item-0",
            },
            {
                type: "wait",
                ms: 1500,
            },
            {
                type: "screenshot",
                screenKey: "ui-03-form-selected",
            },
        ],
    },
    {
        ...EMPTY_RUNNER_CONFIG,
        scenarioId: "login-home",
        scenarioName: "Đăng nhập + màn hình chính",
        uiScreens: [
            {
                screenKey: "ui-01-login",
                label: "Màn hình đăng nhập",
                threshold: 70,
            },
            {
                screenKey: "ui-02-home",
                label: "Màn hình chính sau đăng nhập",
                threshold: 70,
            },
        ],
        uiActions: [
            {
                type: "wait",
                ms: 2500,
            },
            {
                type: "screenshot",
                screenKey: "ui-01-login",
            },
            {
                type: "textTag",
                tag: "input-username",
                value: "admin",
            },
            {
                type: "textTag",
                tag: "input-password",
                value: "123456",
            },
            {
                type: "tapTag",
                tag: "btn-login",
            },
            {
                type: "wait",
                ms: 1500,
            },
            {
                type: "screenshot",
                screenKey: "ui-02-home",
            },
        ],
    },
    {
        ...EMPTY_RUNNER_CONFIG,
        scenarioId: "calculator",
        scenarioName: "Máy tính đơn giản",
        uiScreens: [
            {
                screenKey: "ui-01-main",
                label: "Màn hình nhập phép tính",
                threshold: 70,
            },
            {
                screenKey: "ui-02-result",
                label: "Màn hình kết quả",
                threshold: 70,
            },
        ],
        uiActions: [
            {
                type: "wait",
                ms: 2500,
            },
            {
                type: "screenshot",
                screenKey: "ui-01-main",
            },
            {
                type: "textTag",
                tag: "input-a",
                value: "5",
            },
            {
                type: "textTag",
                tag: "input-b",
                value: "3",
            },
            {
                type: "tapTag",
                tag: "btn-plus",
            },
            {
                type: "wait",
                ms: 1200,
            },
            {
                type: "screenshot",
                screenKey: "ui-02-result",
            },
        ],
    },
    {
        ...EMPTY_RUNNER_CONFIG,
        scenarioId: "todo-list",
        scenarioName: "Todo List",
        uiScreens: [
            {
                screenKey: "ui-01-empty",
                label: "Màn hình danh sách rỗng",
                threshold: 70,
            },
            {
                screenKey: "ui-02-list",
                label: "Màn hình sau khi thêm công việc",
                threshold: 70,
            },
            {
                screenKey: "ui-03-detail",
                label: "Màn hình chi tiết công việc",
                threshold: 70,
            },
        ],
        uiActions: [
            {
                type: "wait",
                ms: 2500,
            },
            {
                type: "screenshot",
                screenKey: "ui-01-empty",
            },
            {
                type: "textTag",
                tag: "input-task",
                value: "Hoc Android",
            },
            {
                type: "tapTag",
                tag: "btn-add-task",
            },
            {
                type: "wait",
                ms: 1200,
            },
            {
                type: "screenshot",
                screenKey: "ui-02-list",
            },
            {
                type: "tapTag",
                tag: "todo-item-0",
            },
            {
                type: "wait",
                ms: 1200,
            },
            {
                type: "screenshot",
                screenKey: "ui-03-detail",
            },
        ],
    },
];

export const DEFAULT_ANDROID_UI_RUNNER_CONFIG: UiRunnerConfig = {
    ...UI_SCENARIO_TEMPLATES[0],
    requiredFiles: [
        "settings.gradle.kts",
        "app/build.gradle.kts",
        "AndroidManifest.xml",
    ],
    entryFiles: ["app/src/main/java", "app/src/main/kotlin"],
    buildCommand: "./gradlew assembleDebug",
    runCommand: "",
    deviceProfiles: ["small-phone"],
    screenshotTargets: UI_SCENARIO_TEMPLATES[0].uiScreens.map((item) => item.screenKey),
};

export function normalizeUiRunnerConfig(value: Partial<UiRunnerConfig> | null | undefined): UiRunnerConfig {
    const base = {
        ...DEFAULT_ANDROID_UI_RUNNER_CONFIG,
        ...(value || {}),
    };

    const uiScreens = Array.isArray(base.uiScreens) ? base.uiScreens : [];
    const uiActions = Array.isArray(base.uiActions) ? base.uiActions : [];

    return {
        ...base,
        requiredFiles: Array.isArray(base.requiredFiles) ? base.requiredFiles : [],
        entryFiles: Array.isArray(base.entryFiles) ? base.entryFiles : [],
        deviceProfiles: Array.isArray(base.deviceProfiles) ? base.deviceProfiles : [],
        screenshotTargets: uiScreens.map((item) => item.screenKey),
        uiScreens,
        uiActions,
    };
}