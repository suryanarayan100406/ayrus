package com.spotifyclone

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class QvoxApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize Firebase here if doing custom setup, otherwise it auto-inits
    }
}
