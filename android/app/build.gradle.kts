plugins {
    id("com.android.application")
}

val webAssetsOutput = layout.buildDirectory.dir("generated/webAssets")
val syncWebAssets by tasks.registering(Sync::class) {
    from(rootProject.projectDir.parentFile) {
        include("index.html", "css/**", "js/**", "images/**", "audio/**")
    }
    into(webAssetsOutput)
}

android {
    namespace = "com.wholeyearwithyou"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.wholeyearwithyou"
        minSdk = 23
        targetSdk = 35
        versionCode = 2
        versionName = "1.1"
    }

    sourceSets.getByName("main").assets.srcDir(webAssetsOutput)

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

tasks.named("preBuild").configure {
    dependsOn(syncWebAssets)
}
