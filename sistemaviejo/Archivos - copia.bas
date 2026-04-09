Attribute VB_Name = "Archivos"
'para leer los ficheros ini

Public Declare Function GetPrivateProfileString Lib "kernel32" Alias "GetPrivateProfileStringA" _
(ByVal lpApplicationName As String, ByVal lpKeyName As Any, ByVal lpDefault As _
String, ByVal lpReturnedString As String, ByVal nSize As Long, ByVal lpFileName As _
String) As Long
'Escribir en fichero ini

Public Declare Function WritePrivateProfileString Lib "kernel32" Alias _
"WritePrivateProfileStringA" (ByVal lpApplicationName As String, ByVal lpKeyName As _
Any, ByVal lpString As Any, ByVal lpFileName As String) As Long

'\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\para copiar archivos
Option Explicit
Private Type SHFILEOPSTRUCT
    hwnd As Long
    wFunc As Long
    pFrom As String
    pTo As String
    fFlags As Integer
    fAnyOperationsAborted As Boolean
    hNameMappings As Long
    lpszProgressTitle As String
End Type

Declare Function SHFileOperation Lib "shell32.dll" Alias "SHFileOperationA" _
(lpFileOp As SHFILEOPSTRUCT) As Long

Private Const FO_COPY = &H2
Private Const FOF_ALLOWUNDO = &H40
'\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\fin copiar archivos


Public Function LeerIni(Archivo As String, Situacion As String, campo As String) As String
    Dim i As Integer
    Dim Est As String
    Est = String$(150, " ")
    i = GetPrivateProfileString(Situacion, campo, "", Est, Len(Est), Archivo)
    If i > 0 Then LeerIni = Est
End Function

Public Function EscribirIni(Situacion As String, campo As String, Valor As String, Archivo As String)
    Dim i As Integer
    Dim Est As String
    
    Est = Valor
    i = WritePrivateProfileString(Situacion, campo, Est, Archivo)
    
End Function

Public Function ExisteArchivo(Nombre As String) As Boolean

Dim Cadena As String
Dim x As Long

On Error GoTo Fallo
    If Nombre = "" Then
        Exit Function
    End If
    Cadena = Nombre
    x = GetAttr(Cadena)
    'Label1.Caption = "El Fichero " & Cadena & " existe"
    ExisteArchivo = True
Exit Function
Fallo:
    ExisteArchivo = False
    'Label1.Caption = "El Fichero " & Cadena & " no existe"
End Function

Function DameDirectorioAplicacion() As String

DameDirectorioAplicacion = UCase$(App.Path)
If Right(DameDirectorioAplicacion, 1) <> "\" Then DameDirectorioAplicacion = DameDirectorioAplicacion & "\"

End Function

Public Sub SHCopyFile(ByVal from_file As String, ByVal to_file As String)
Dim sh_op As SHFILEOPSTRUCT

    With sh_op
        .hwnd = 0
        .wFunc = FO_COPY
        .pFrom = from_file & vbNullChar & vbNullChar
        .pTo = to_file & vbNullChar & vbNullChar
        .fFlags = FOF_ALLOWUNDO
    End With

    SHFileOperation sh_op
End Sub
