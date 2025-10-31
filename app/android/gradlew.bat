@ECHO OFF

SET DIR=%~dp0
SET APP_BASE_NAME=%~n0
SET APP_HOME=%DIR%

IF NOT DEFINED JAVA_HOME (
  SET JAVA_EXE=java
) ELSE (
  SET JAVA_EXE=%JAVA_HOME%\bin\java.exe
)

SET WRAPPER_JAR=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar

IF NOT EXIST "%WRAPPER_JAR%" (
  SET DISTRIBUTION_URL=https://repo1.maven.org/maven2/org/gradle/gradle-wrapper/8.3/gradle-wrapper-8.3.jar
  ECHO Downloading Gradle wrapper bootstrap...
  POWERSHELL -Command "try { Invoke-WebRequest %DISTRIBUTION_URL% -OutFile '%WRAPPER_JAR%' -UseBasicParsing } catch { exit 1 }"
  IF NOT EXIST "%WRAPPER_JAR%" (
    ECHO ERROR: Failed to download Gradle wrapper. Install PowerShell 3+ or download the jar manually. >&2
    EXIT /B 1
  )
)

"%JAVA_EXE%" -Xmx64m -Xms64m -classpath "%WRAPPER_JAR%" org.gradle.wrapper.GradleWrapperMain %*
