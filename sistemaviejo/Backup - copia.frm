VERSION 5.00
Object = "{F9043C88-F6F2-101A-A3C9-08002B2F49FB}#1.2#0"; "comdlg32.ocx"
Begin VB.Form Backup 
   BackColor       =   &H00FFFFFF&
   BorderStyle     =   1  'Fixed Single
   Caption         =   "Backup / Recovery database"
   ClientHeight    =   3405
   ClientLeft      =   45
   ClientTop       =   330
   ClientWidth     =   3705
   LinkTopic       =   "Form1"
   MaxButton       =   0   'False
   MDIChild        =   -1  'True
   MinButton       =   0   'False
   ScaleHeight     =   3405
   ScaleWidth      =   3705
   Begin VB.PictureBox Mensaje 
      Appearance      =   0  'Flat
      BackColor       =   &H0080FF80&
      ForeColor       =   &H80000008&
      Height          =   500
      Left            =   0
      ScaleHeight     =   465
      ScaleWidth      =   3465
      TabIndex        =   3
      Top             =   1080
      Visible         =   0   'False
      Width           =   3495
      Begin VB.Label Label14 
         Alignment       =   2  'Center
         BackColor       =   &H0080FF80&
         Caption         =   "en proceso ...."
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   -1  'True
            Strikethrough   =   0   'False
         EndProperty
         Height          =   255
         Left            =   120
         TabIndex        =   4
         Top             =   120
         Width           =   3255
      End
   End
   Begin VB.CommandButton CmdRecuperar 
      Caption         =   "RESTAURAR COPIA SEGURIDAD"
      Height          =   615
      Left            =   240
      TabIndex        =   2
      Top             =   1560
      Width           =   3015
   End
   Begin VB.CommandButton CmdCopiaseguridad 
      Caption         =   "CREAR COPIA SEGURIDAD"
      Height          =   615
      Left            =   240
      TabIndex        =   1
      Top             =   600
      Width           =   3015
   End
   Begin VB.CommandButton CmdSalir 
      Caption         =   "SALIR"
      Height          =   375
      Left            =   960
      TabIndex        =   0
      Top             =   2640
      Width           =   1695
   End
   Begin MSComDlg.CommonDialog DlgArchivos 
      Left            =   120
      Top             =   2400
      _ExtentX        =   847
      _ExtentY        =   847
      _Version        =   393216
   End
End
Attribute VB_Name = "Backup"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Dim DirAnterior As String
Dim NomArchivoSeg As String

Dim FActual As String
Const TITULO = "BACKUP" 'el titulo de la ventana y de los msgbox


Private Sub CmdCopiaseguridad_Click()

CompactarBD 'llamo a la funcion de compactar la base de datos

If DirAnterior <> "" Then
    DlgArchivos.InitDir = DirAnterior
Else
    DlgArchivos.InitDir = DameDirectorioAplicacion
End If

DlgArchivos.FileName = FActual
' Si ocurre un error ejecutar ManipularErrorGuardar
On Error GoTo ManipularErrorGuardar
' Generar un error cuando se pulse Cancelar
DlgArchivos.CancelError = True
' Filtros
DlgArchivos.Filter = "Ficheros de proyecto (*.bak)|*.bak|Todos los ficheros (*.*)|*.*"
' Filtro por omisión
DlgArchivos.FilterIndex = 1
' Visualizar la caja de diálogo

DlgArchivos.ShowSave

Label14.Caption = "Copiando copia de seguridad"
DoEvents
SHCopyFile "C:\DB_JAVIER\BD_JAVIER.mdb", DlgArchivos.FileName

'recogemos los datos
Dim Indice As Long


For Indice1 = Len(DlgArchivos.FileName) To 1 Step -1
        If Mid$(DlgArchivos.FileName, Indice1, 1) = "\" Then Exit For
Next
    
NomArchivoSeg = Mid$(DlgArchivos.FileName, Indice1 + 1, Len(DlgArchivos.FileName))
DirAnterior = Mid$(DlgArchivos.FileName, 1, (Len(DlgArchivos.FileName) - Len(NomArchivoSeg)) - 1)

SalirGuardar:

Mensaje.Visible = False
MsgBox "Finished backup", vbInformation, TITULO

Screen.MousePointer = 0
Exit Sub

ManipularErrorGuardar:
' Manipular el error

Screen.MousePointer = 0
Mensaje.Visible = False
If Err.Number = cdlCancel Then Exit Sub
MsgBox Err.Description
Resume SalirGuardar

End Sub

Private Function CompactarBD()

    Screen.MousePointer = 11
    
   
    
    On Error Resume Next
    
    
    Dim BaseDeDatos As String
    Dim BaseDeDatosCo As String
    
    
    BaseDeDatos = DBPath 'la direccion de la base de datos original
    BaseDeDatosCo = Mid$(BaseDeDatos, 1, Len(BaseDeDatos) - 4) & "Co.mdb" 'la direccion que tendra la copia
  
    'compruebo y elimino si existe alguna copia de seguridad
    
    If Dir(DameDirectorioAplicacion & "~bdatos.mdb") Then _
    Kill DameDirectorioAplicacion & "~bdatos.mdb"
    
    '-Mostrar el mensaje de grabando  ---------------------------------
     Mensaje.Visible = True
     Label14.Caption = "Copia de seguridad en progreso"
    DoEvents
        
    'hago una copia de seguridad de la base de datos antes de compactar
    
    FileCopy BaseDeDatos, DameDirectorioAplicacion & "~bdatos.mdb"
    
    ' Me aseguro que no existe un archivo con el
    ' nombre de la base de datos compactada (de algún error anterior).
    If Dir(BaseDeDatosCo) <> "" Then _
        Kill BaseDeDatosCo

    
    ' Esta instrucción crea una versión compactada de la base de datos
    Label14.Caption = "Compactando base de datos"
    
    DoEvents
    DBEngine.CompactDatabase BaseDeDatos, _
        BaseDeDatosCo, dbLangGeneral
    
    'si nuestra bd tiene contraseña se haría con esta instrucción:
    
'    DBEngine.CompactDatabase BaseDeDatos, _
'        BaseDeDatosCo, dbLangSpanish & ";pwd =" & gClave, , ";pwd =" & gClave
    'si tiene contraseña, hay que añadir ,pwd="contraseña"

    'elimino la base de datos y copio la compactada con el nombre bueno
    
    If Dir(BaseDeDatosCo) <> "" Then
         Kill BaseDeDatos
    End If
    
    Label14.Caption = "Restaurando base de datos"
    DoEvents

    FileCopy BaseDeDatosCo, BaseDeDatos
    
    'elimino las copias de seguridad
    Kill BaseDeDatosCo
    Kill DameDirectorioAplicacion & "~bdatos.mdb"

    
    Screen.MousePointer = 0
    
    Label14.Caption = "Base de datos compactada"
    DoEvents
    
       
End Function

Private Sub CmdRecuperar_Click()

    DlgArchivos.CancelError = True
    On Error Resume Next
    DlgArchivos.FileName = NomArchivoSeg
    DlgArchivos.InitDir = DirAnterior
    DlgArchivos.Filter = "Backup (*.bak)|*.bak|" & "all files (*.*)|*.*"
    DlgArchivos.Action = 1
    If Err.Number = 0 Then
        
        'cerrar la base de datos
        On Error Resume Next
        'gconexion.Cerrar
        'Set mBasedeDatos = Nothing
        
        If MsgBox("La base de datos será reemplazada, ¿Estas seguro?", vbQuestion + vbYesNo, TITULO) <> vbYes Then Exit Sub
        Screen.MousePointer = 11
        On Error Resume Next
        FileCopy DlgArchivos.FileName, App.Path & "\bd.mdb"
        If Err.Number <> 0 Then
            MsgBox "Error recuperando la base de datos", vbCritical, TITULO
        Else
            MsgBox "Recuperacion de la base de datos completa", vbInformation, TITULO
        End If
        On Error GoTo 0
        Screen.MousePointer = 0

    Else
        MsgBox "Restauración de la base de datos cancelada por el usuario", vbInformation, TITULO
    End If


End Sub


Private Sub CmdSalir_Click()
    Unload Me
End Sub

Private Sub Form_Load()
Dim nPermiso As Integer

Me.Caption = TITULO

Screen.MousePointer = 0

FActual = Format(Now, "dd_mm_yyyy")

'comprobar si existe el archivo ini

If Not ExisteArchivo(DameDirectorioAplicacion & "config.ini") Then
    DirAnterior = DameDirectorioAplicacion
'si no existe dar direccion por defecto (en este caso, la carpera del programa)
Else
    DirAnterior = LeerIni(DameDirectorioAplicacion & "config.ini", "CopiaBD", "DirCopia")
    NomArchivoSeg = LeerIni(DameDirectorioAplicacion & "config.ini", "CopiaBD", "NombreCopia")
    
    'aqui encuentro un fallo que no se solucionar
    '-> en leerini, no me lee toda la direccion completa que esta en el archivo ini
    '-> no se si tiene limitación de tamaño de alguna forma.
    
    If Trim$(DirAnterior) <> "" Then
        DirAnterior = Mid(DirAnterior, 1, Len(Trim$(DirAnterior)) - 1)
    Else
        DirAnterior = DameDirectorioAplicacion
    End If
    
    If Trim$(NomArchivoSeg) <> "" Then
        NomArchivoSeg = Mid(NomArchivoSeg, 1, Len(Trim$(NomArchivoSeg)) - 1)
    End If
    
'si existe, leer los datos diranterior
End If

 'en este momento, si tenemos abierta la base de datos de alguna manera (controles ado,
 ' dao, dataenviroment, etc) la cerraremos
 'Si la base de datos está abierta dará error en compactarla y en recuperarla.
 
 
 'cerrar la base de datos


End Sub



Private Sub Form_Unload(Cancel As Integer)

If DirAnterior <> "" Then
    EscribirIni "CopiaBD", "DirCopia", DirAnterior, DameDirectorioAplicacion & "config.ini"
End If

If NomArchivoSeg <> "" Then
    EscribirIni "CopiaBD", "NombreCopia", NomArchivoSeg, DameDirectorioAplicacion & "config.ini"
End If

End Sub



Function DameDirectorioAplicacion() As String

DameDirectorioAplicacion = UCase$(App.Path)
If Right(DameDirectorioAplicacion, 1) <> "\" Then DameDirectorioAplicacion = DameDirectorioAplicacion & "\"

End Function

