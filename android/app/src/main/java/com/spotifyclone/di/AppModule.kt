package com.spotifyclone.di

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.ktx.auth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.ktx.firestore
import com.google.firebase.ktx.Firebase
import com.spotifyclone.data.remote.ApiService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton
import kotlinx.coroutines.tasks.await
import kotlinx.coroutines.runBlocking

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    // NOTE: For local emulators, 10.0.2.2 maps to the host machine's localhost (Go server port 8080)
    private const val BASE_URL = "http://10.0.2.2:8080/api/"

    @Provides
    @Singleton
    fun provideFirebaseAuth(): FirebaseAuth = Firebase.auth

    @Provides
    @Singleton
    fun provideFirebaseFirestore(): FirebaseFirestore = Firebase.firestore

    @Provides
    @Singleton
    fun provideAuthInterceptor(auth: FirebaseAuth): Interceptor {
        return Interceptor { chain ->
            val requestBuilder = chain.request().newBuilder()
            
            // Blocking fetch for token injection in headers
            val user = auth.currentUser
            if (user != null) {
                val tokenResult = runBlocking {
                    try {
                        user.getIdToken(false).await()
                    } catch (e: Exception) { null }
                }
                tokenResult?.token?.let { token ->
                    requestBuilder.addHeader("Authorization", "Bearer $token")
                }
            }
            
            chain.proceed(requestBuilder.build())
        }
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(authInterceptor: Interceptor): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }
        return OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
    }

    @Provides
    @Singleton
    fun provideApiService(okHttpClient: OkHttpClient): ApiService {
        return Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
