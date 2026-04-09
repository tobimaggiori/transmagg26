VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form ABMChoferes 
   BackColor       =   &H00000000&
   Caption         =   "ABM Choferes"
   ClientHeight    =   5700
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   12000
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   5700
   ScaleWidth      =   12000
   Begin VB.CommandButton cmdMover 
      Caption         =   "<<"
      Height          =   375
      Index           =   0
      Left            =   5760
      TabIndex        =   14
      Top             =   5160
      Width           =   495
   End
   Begin VB.CommandButton cmdMover 
      Caption         =   "<"
      Height          =   375
      Index           =   1
      Left            =   6240
      TabIndex        =   13
      Top             =   5160
      Width           =   495
   End
   Begin VB.CommandButton cmdMover 
      Caption         =   ">"
      Height          =   375
      Index           =   2
      Left            =   6780
      TabIndex        =   12
      Top             =   5160
      Width           =   495
   End
   Begin VB.CommandButton cmdMover 
      Caption         =   ">>"
      Height          =   375
      Index           =   3
      Left            =   7260
      TabIndex        =   11
      Top             =   5160
      Width           =   435
   End
   Begin VB.Frame Frame1 
      BackColor       =   &H00000000&
      Caption         =   "Datos del Chofer"
      ForeColor       =   &H000080FF&
      Height          =   3615
      Left            =   720
      TabIndex        =   3
      Top             =   1320
      Width           =   11175
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   9
         Left            =   9720
         TabIndex        =   34
         Text            =   "Text2"
         Top             =   720
         Width           =   975
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   8
         Left            =   7680
         TabIndex        =   33
         Text            =   "Text2"
         Top             =   720
         Width           =   1095
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   7
         Left            =   5880
         TabIndex        =   32
         Text            =   "Text2"
         Top             =   720
         Width           =   855
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   6
         Left            =   3600
         TabIndex        =   31
         Text            =   "Text2"
         Top             =   720
         Width           =   1575
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   5
         Left            =   1200
         TabIndex        =   26
         Text            =   "Text2"
         Top             =   720
         Width           =   1575
      End
      Begin VB.CommandButton cmdMover1 
         Caption         =   ">>"
         Height          =   375
         Index           =   3
         Left            =   9660
         TabIndex        =   24
         Top             =   3000
         Width           =   435
      End
      Begin VB.CommandButton cmdMover1 
         Caption         =   ">"
         Height          =   375
         Index           =   2
         Left            =   9180
         TabIndex        =   23
         Top             =   3000
         Width           =   495
      End
      Begin VB.CommandButton cmdMover1 
         Caption         =   "<"
         Height          =   375
         Index           =   1
         Left            =   8640
         TabIndex        =   22
         Top             =   3000
         Width           =   495
      End
      Begin VB.CommandButton cmdMover1 
         Caption         =   "<<"
         Height          =   375
         Index           =   0
         Left            =   8160
         TabIndex        =   21
         Top             =   3000
         Width           =   495
      End
      Begin MSComctlLib.ListView ListChoferes 
         Height          =   1695
         Left            =   240
         TabIndex        =   10
         Top             =   1200
         Width           =   10035
         _ExtentX        =   17701
         _ExtentY        =   2990
         View            =   3
         LabelWrap       =   0   'False
         HideSelection   =   0   'False
         _Version        =   393217
         ForeColor       =   -2147483640
         BackColor       =   -2147483648
         BorderStyle     =   1
         Appearance      =   1
         NumItems        =   8
         BeginProperty ColumnHeader(1) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            Text            =   "Apellido y Nombre"
            Object.Width           =   5292
         EndProperty
         BeginProperty ColumnHeader(2) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   1
            Text            =   "Telefono"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(3) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   2
            Text            =   "CUIL"
            Object.Width           =   2646
         EndProperty
         BeginProperty ColumnHeader(4) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   3
            Text            =   "Marca"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(5) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   4
            Text            =   "Modelo"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(6) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   5
            Text            =   "Año"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(7) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   6
            Text            =   "Pat Chasis"
            Object.Width           =   2540
         EndProperty
         BeginProperty ColumnHeader(8) {BDD1F052-858B-11D1-B16A-00C0F0283628} 
            SubItemIndex    =   7
            Text            =   "Pat Acop"
            Object.Width           =   2540
         EndProperty
      End
      Begin VB.TextBox Text1 
         BackColor       =   &H00FFFFFF&
         Height          =   285
         Index           =   4
         Left            =   8400
         TabIndex        =   9
         Text            =   "Text1"
         Top             =   360
         Width           =   2295
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   3
         Left            =   6000
         TabIndex        =   7
         Text            =   "Text1"
         Top             =   360
         Width           =   1695
      End
      Begin VB.TextBox Text1 
         Height          =   285
         Index           =   2
         Left            =   1920
         TabIndex        =   6
         Text            =   "Text1"
         Top             =   360
         Width           =   3015
      End
      Begin KewlButtonz.KewlButtons Agregar 
         Height          =   375
         Left            =   960
         TabIndex        =   15
         Top             =   3000
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Agregar"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMChoferes.frx":0000
         PICN            =   "ABMChoferes.frx":001C
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Eliminar 
         Height          =   375
         Left            =   2400
         TabIndex        =   16
         Top             =   3000
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Eliminar"
         ENAB            =   0   'False
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMChoferes.frx":209E
         PICN            =   "ABMChoferes.frx":20BA
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Modificar 
         Height          =   375
         Left            =   3840
         TabIndex        =   18
         Top             =   3000
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Cambiar"
         ENAB            =   0   'False
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMChoferes.frx":2654
         PICN            =   "ABMChoferes.frx":2670
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons BuscaCho 
         Height          =   375
         Left            =   5280
         TabIndex        =   20
         Top             =   3000
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   661
         BTYPE           =   1
         TX              =   "Buscar"
         ENAB            =   -1  'True
         BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         COLTYPE         =   2
         FOCUSR          =   -1  'True
         BCOL            =   4210752
         BCOLO           =   4210752
         FCOL            =   14737632
         FCOLO           =   14737632
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMChoferes.frx":7C82
         PICN            =   "ABMChoferes.frx":7C9E
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin VB.Label Label8 
         BackColor       =   &H80000008&
         Caption         =   "Acoplado"
         ForeColor       =   &H0080FFFF&
         Height          =   255
         Left            =   8880
         TabIndex        =   30
         Top             =   720
         Width           =   855
      End
      Begin VB.Label Label7 
         BackColor       =   &H80000008&
         Caption         =   "Chasis"
         ForeColor       =   &H0080FFFF&
         Height          =   255
         Left            =   6960
         TabIndex        =   29
         Top             =   720
         Width           =   855
      End
      Begin VB.Label Label6 
         BackColor       =   &H80000008&
         Caption         =   "Año"
         ForeColor       =   &H0080FFFF&
         Height          =   255
         Left            =   5280
         TabIndex        =   28
         Top             =   720
         Width           =   615
      End
      Begin VB.Label Label5 
         BackColor       =   &H80000008&
         Caption         =   "Modelo"
         ForeColor       =   &H0080FFFF&
         Height          =   255
         Left            =   2880
         TabIndex        =   27
         Top             =   720
         Width           =   1095
      End
      Begin VB.Label Label4 
         BackColor       =   &H80000008&
         Caption         =   "Marca"
         ForeColor       =   &H0080FFFF&
         Height          =   255
         Left            =   240
         TabIndex        =   25
         Top             =   720
         Width           =   735
      End
      Begin VB.Label Label3 
         BackColor       =   &H00000000&
         Caption         =   "CUIL"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Left            =   7800
         TabIndex        =   8
         Top             =   360
         Width           =   1455
      End
      Begin VB.Label Label1 
         BackColor       =   &H00000000&
         Caption         =   "Apellido y Nombre"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Index           =   1
         Left            =   240
         TabIndex        =   5
         Top             =   360
         Width           =   1935
      End
      Begin VB.Label Label2 
         BackColor       =   &H00000000&
         Caption         =   "Telefono"
         BeginProperty Font 
            Name            =   "MS Sans Serif"
            Size            =   8.25
            Charset         =   0
            Weight          =   700
            Underline       =   0   'False
            Italic          =   0   'False
            Strikethrough   =   0   'False
         EndProperty
         ForeColor       =   &H0080C0FF&
         Height          =   255
         Left            =   5040
         TabIndex        =   4
         Top             =   360
         Width           =   1455
      End
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2400
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   840
      Width           =   4815
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   1680
      TabIndex        =   1
      Text            =   "Text1"
      Top             =   840
      Width           =   615
   End
   Begin KewlButtonz.KewlButtons Buscar 
      Height          =   495
      Left            =   7440
      TabIndex        =   17
      Top             =   720
      Width           =   1335
      _ExtentX        =   2355
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Buscar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   14737632
      FCOLO           =   14737632
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "ABMChoferes.frx":99A8
      PICN            =   "ABMChoferes.frx":99C4
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin KewlButtonz.KewlButtons Cancelar 
      Height          =   495
      Left            =   8400
      TabIndex        =   19
      Top             =   5040
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   873
      BTYPE           =   1
      TX              =   "Cancelar"
      ENAB            =   -1  'True
      BeginProperty FONT {0BE35203-8F91-11CE-9DE3-00AA004BB851} 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      COLTYPE         =   2
      FOCUSR          =   -1  'True
      BCOL            =   4210752
      BCOLO           =   4210752
      FCOL            =   12632256
      FCOLO           =   4210752
      MCOL            =   4210752
      MPTR            =   1
      MICON           =   "ABMChoferes.frx":B6CE
      PICN            =   "ABMChoferes.frx":B6EA
      UMCOL           =   -1  'True
      SOFT            =   0   'False
      PICPOS          =   0
      NGREY           =   0   'False
      FX              =   1
      HAND            =   0   'False
      CHECK           =   0   'False
      VALUE           =   0   'False
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Fletero"
      BeginProperty Font 
         Name            =   "MS Sans Serif"
         Size            =   8.25
         Charset         =   0
         Weight          =   700
         Underline       =   0   'False
         Italic          =   0   'False
         Strikethrough   =   0   'False
      EndProperty
      ForeColor       =   &H0080C0FF&
      Height          =   255
      Index           =   0
      Left            =   720
      TabIndex        =   0
      Top             =   840
      Width           =   1455
   End
End
Attribute VB_Name = "ABMChoferes"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private ItemLista As ListItem
Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsChoferes
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("CodChoferes") + 1
            
        Else
            
            GetPrimaryKey = 1
        
        End If
        
    End With
End Function
Private Function TableError(oErr As ErrObject) As Boolean
    Dim sMessage As String
    Dim nResponse As Integer
    ' estos son los cuatro códigos de error que se gestionarán especialmente
    ' dentro de esta función
    Const TB_OPEN = 3262            ' tabla ya abierta en modo compartido
    Const TB_IN_USE = 3261          ' tabla ya abierta en modo exclusivo
    Const TB_READ_ONLY = 3027       ' no se puede actualizar, sólo lectura
    Const TB_LOCKED = 3186          ' tabla bloqueada, no se puede actualizar
    Const DB_IN_USE = 3045  ' la base ya está abierta en modo exclusivo
    
    ' De manera predeterminada se asigna False como retorno de la función
    ' que significa que no se quiere volver a intentar
    TableError = False
    
    With oErr
        ' selecciona el código dependiendo del error
        Select Case .Number
            ' la tabla no pudo ser abierta en el modo requerido
            ' se pregunta al usuario si se quiere abrir en modo lectura
            Case TB_OPEN, TB_IN_USE:
                sMessage = "No puede agregar un registro porque la " _
                         & "BD está bloqueada por otro usuario. "
                'Exit Function
            ' la tabla es sólo lectura y no se pueden agregar registros
            Case TB_READ_ONLY:
                sMessage = "No puede agregar un registro porque la " _
                         & "BD está abierta de sólo lectura. "
                         
            ' la tabla está bloqueada y no se pueden agregar registros
            Case TB_LOCKED:
                sMessage = "No puede agregar un registro porque la " _
                         & "BD está bloqueada por otro usuario. "
            ' otro tipo de error: se visualiza el número y la descripción
            Case DB_IN_USE
                SMSSAGE = "ABIERTA EN FORMA ESCLUSIVA POR OTRO USUARIO"
                ' del error
            Case Else
                sMessage = "Error #" & .Number & ": " & .Description
        End Select
    End With
    ' visualiza el mensaje de error
    MsgBox sMessage, vbExclamation, "TABLA ERROR"
    
    ' ha habido un error y nos aseguramos que la tabla queda cerrada
    ' y en la pantalla quedan las etiquetas adecuadas
    'Set rs = Nothing
End Function
Private Sub Agregar_Click()

If Accion = "Nuevo" Then
    On Error GoTo ERR_cmdAltaRegistro:
    If Not Text1(0) = "" Then
        If Not Text1(2) = "" And Not Text1(3) = "" And Not Text1(4) = "" Then
            Dim nAccessValue As Integer
            Screen.MousePointer = vbHourglass
            nAccessValue = 0
            ' aplica los permisos deseados por el usuario
            nAccessValue = nAccessValue + dbDenyWrite
            Set rsChoferes = Nothing
            Set rsChoferes = db.OpenRecordset("SELECT * From Choferes Order By CodChoferes")
            DBEngine.Idle dbRefreshCache
            Dim lPrimaryKey As Long
            Dim sMessage As String
            ' recupera una clave única desde la rutina GetPrimaryKey
            lPrimaryKey = GetPrimaryKey
            With rsChoferes
                .AddNew
                .Fields("CodFlet") = Text1(0)
                .Fields("CodChoferes") = lPrimaryKey
                .Fields("AyN") = Text1(2)
                .Fields("Telefono") = Text1(3)
                .Fields("CUIL") = Text1(4)
                .Fields("Marca") = Text1(5)
                .Fields("Modelo") = Text1(6)
                .Fields("Año") = Val(Text1(7))
                .Fields("PatChasis") = Text1(8)
                .Fields("PatAcop") = Text1(9)
                .Update
            End With
            rsChoferes.Close
            Items = 0
            For Items = Items + 1 To Text1.Count
                Text1(Items - 1) = ""
                Text1(Items - 1).BackColor = &H80000005
            Next
            ListChoferes.ListItems.Clear
            Eliminar.Enabled = False: Modificar.Enabled = False
            ' Si el código pasa por aquí es porque todo ha ido bien
            sMessage = "El CHOFER fue agregado exitosamente con el Codigo:   " & lPrimaryKey
            MsgBox sMessage, vbInformation, "Alta Fletero"
            Screen.MousePointer = vbDefault
            Exit Sub
        End If
    End If
ERR_cmdAltaRegistro:
    TableError Err
    Set rsFleteros = Nothing
    Set rsChoferes = Nothing
    Screen.MousePointer = vbDefault
End If
If Accion = "Modificar" Then
    On Error GoTo ERR_cmdModificar:
    Screen.MousePointer = vbHourglass
    With rsChoferes
        .Fields("AyN") = Text1(2)
        .Fields("Telefono") = Text1(3)
        .Fields("CUIL") = Text1(4)
        .Fields("Marca") = Text1(5)
        .Fields("Modelo") = Text1(6)
        .Fields("Año") = Val(Text1(7))
        .Fields("PatChasis") = Text1(8)
        .Fields("PatAcop") = Text1(9)
        .Update
        .LockEdits = False
    End With
    Sql = "SELECT * FROM Choferes WHERE CodFlet = " & Text1(0) & ""
    Set rsChoferes = db.OpenRecordset(Sql, 2)
    If Not rsChoferes.EOF And Not rsChoferes.BOF Then
        ListChoferes.ListItems.Clear
        Do While Not rsChoferes.EOF
            Set ItemLista = ListChoferes.ListItems.Add(, , rsChoferes!AyN)
                ItemLista.Tag = rsChoferes!AyN
                ItemLista.SubItems(1) = rsChoferes!Telefono
                ItemLista.SubItems(2) = rsChoferes!CUIL
                ItemLista.SubItems(3) = rsChoferes!Marca
                ItemLista.SubItems(4) = rsChoferes!Modelo
                ItemLista.SubItems(5) = rsChoferes!AÑO
                ItemLista.SubItems(6) = rsChoferes!PatChasis
                ItemLista.SubItems(7) = rsChoferes!PatAcop
            rsChoferes.MoveNext
        Loop
    End If
    Items = 2
    For Items = Items + 1 To Text1.Count
        Text1(Items - 1).BackColor = &H80000005
        Text1(Items - 1) = ""
    Next
    MsgBox "El Chofer ha sido Modificado Exitosamente", vbInformation, "Modificar Registro"
    Screen.MousePointer = vbDefault
    rsChoferes.Close
    Exit Sub
ERR_cmdModificar:
    TableError Err
End If
End Sub

Private Sub BuscaCho_Click()
If BuscaCho.ForeColor = &HFF& Then
    Criterio = "AyN Like '*" & Text1(2) & "*'"
    Sql = "SELECT * FROM Choferes WHERE " & Criterio
    Set rsChoferes = db.OpenRecordset(Sql, 2)
    If Not rsChoferes.EOF And Not rsChoferes.BOF Then
        Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsChoferes!codflet & "")
        Text1(0) = rsFleteros!codflet
        Text1(1) = rsFleteros!DescFlet
        Text1(2) = rsChoferes!AyN
        Text1(3) = rsChoferes!Telefono
        Text1(4) = rsChoferes!CUIL
        Items = 0
        For Items = Items + 1 To cmdMover1.Count
            cmdMover1(Items - 1).Visible = True
        Next
        Text1(2).BackColor = &H80000005
        BuscaCho.ForeColor = &HE0E0E0
    Else
        MsgBox "No hay Coincidencias", vbInformation
    End If
Else
    Text1(2).Text = ""
    Text1(2).BackColor = &H40C0&
    BuscaCho.ForeColor = &HFF&
End If
End Sub
Private Sub MostrarChofer()
Set rsFleteros = db.OpenRecordset("Select * From Fleteros Where CodFlet = " & rsChoferes!codflet & "")
Text1(0) = rsFleteros!codflet
Text1(1) = rsFleteros!DescFlet
Text1(2) = rsChoferes!AyN
Text1(3) = rsChoferes!Telefono
Text1(4) = rsChoferes!CUIL
End Sub

Private Sub Buscar_Click()
If Buscar.ForeColor = &HFF& Then
    Criterio = "DescFlet Like '*" & Text1(1) & "*'"
    Sql = "SELECT * FROM Fleteros WHERE " & Criterio
    Set rsFleteros = db.OpenRecordset(Sql, 2)
    If Not rsFleteros.EOF And Not rsFleteros.BOF Then
        MostrarRegistro
        Items = 0
        For Items = Items + 1 To cmdMover.Count
            cmdMover(Items - 1).Visible = True
        Next
        Text1(1).BackColor = &H80000005
        Buscar.ForeColor = &HE0E0E0
    Else
        MsgBox "No hay Coincidencias", vbInformation
    End If
Else
    Text1(1).Text = ""
    Text1(1).BackColor = &H40C0&
    Buscar.ForeColor = &HFF&
End If
End Sub

Private Sub Cancelar_Click()
Form_Initialize
Form_Load
End Sub

Private Sub cmdMover_Click(Index As Integer)
 ' se definen las constantes para indicar el tipo de navegación
    ' cada constante se corresponde con un índice de la matriz de
    ' controles
    Const MOVE_FIRST = 0
    Const MOVE_PREVIOUS = 1
    Const MOVE_NEXT = 2
    Const MOVE_LAST = 3
    With rsFleteros
        Select Case Index
            ' se mueve al primer registro
            Case MOVE_FIRST:
                .MoveFirst
            ' se mueve al registro anterior, si llega al inicio
            ' del recordset, se mueve al primer registro
            Case MOVE_PREVIOUS:
                .MovePrevious
                If (.BOF) Then .MoveFirst
            ' se mueve al registro siguiente, si llega al final
            ' del recordset, se mueve al último registro
            Case MOVE_NEXT:
                .MoveNext
                If (.EOF) Then .MoveLast
            ' se mueve al último registro
            Case MOVE_LAST:
                .MoveLast
        End Select
    End With
    ' visualiza el registro
    MostrarRegistro
End Sub

Private Sub cmdMover1_Click(Index As Integer)
' se definen las constantes para indicar el tipo de navegación
    ' cada constante se corresponde con un índice de la matriz de
    ' controles
    Const MOVE_FIRST = 0
    Const MOVE_PREVIOUS = 1
    Const MOVE_NEXT = 2
    Const MOVE_LAST = 3
    With rsChoferes
        Select Case Index
            ' se mueve al primer registro
            Case MOVE_FIRST:
                .MoveFirst
            ' se mueve al registro anterior, si llega al inicio
            ' del recordset, se mueve al primer registro
            Case MOVE_PREVIOUS:
                .MovePrevious
                If (.BOF) Then .MoveFirst
            ' se mueve al registro siguiente, si llega al final
            ' del recordset, se mueve al último registro
            Case MOVE_NEXT:
                .MoveNext
                If (.EOF) Then .MoveLast
            ' se mueve al último registro
            Case MOVE_LAST:
                .MoveLast
        End Select
    End With
    ' visualiza el registro
    MostrarChofer
End Sub

Private Sub Eliminar_Click()
On Error GoTo ERR_cmdEliminar:
If Not Text1(2) = "" Then
    Sql = "CodFlet = " & Text1(0) & " AND CUIL = '" & Text1(4) & "'"
    Set rsChoferes = db.OpenRecordset("Choferes", 2)
    rsChoferes.FindFirst (Sql)
    If Not rsChoferes.NoMatch Then
        rsChoferes.Delete
    Else
        MsgBox "Chofer no encontrado"
    End If
        rsChoferes.Close
    Items = 0
    For Items = Items + 1 To Text1.Count
        Text1(Items - 1) = ""
        Text1(Items - 1).BackColor = &H80000005
    Next
    ListChoferes.ListItems.Clear
    Agregar.Enabled = True: Modificar.Enabled = False: Eliminar.Enabled = False
    MsgBox "Chofer Eliminado Correctamente"
    Exit Sub
End If
ERR_cmdEliminar:
    TableError Err
    Set rsChoferes = Nothing
End Sub

Private Sub Form_Initialize()
Set rsFleteros = Nothing
Set rsChoferes = Nothing
End Sub

Private Sub Form_Load()
On Error Resume Next
Items = 0
For Items = Items + 1 To Text1.Count
    Text1(Items - 1).Text = ""
    Text1(Items - 1).BackColor = &H80000005
Next
Items = 0
For Items = Items + 1 To cmdMover.Count
    cmdMover(Items - 1).Visible = False
Next
Items = 0
For Items = Items + 1 To cmdMover1.Count
    cmdMover1(Items - 1).Visible = False
Next

ListChoferes.ListItems.Clear
Agregar.Enabled = True
Eliminar.Enabled = False: Buscar.Enabled = True: BuscaCho.Enabled = True

Modificar.Enabled = False
Accion = "Nuevo"
End Sub

Private Sub KewlButtons1_Click()

End Sub

Private Sub ListChoferes_Click()
If Not ListChoferes.ListItems.Count = 0 Then
    Set ItemLista = ListChoferes.ListItems.Item(ListChoferes.SelectedItem.Index)
    Items = 2
    For Items = Items + 1 To Text1.Count
        Text1(Items - 1).Text = ""
        Text1(Items - 1).BackColor = &H40C0&
    Next
    Text1(2) = ItemLista.Tag
    Text1(3) = ItemLista.SubItems(1)
    Text1(4) = ItemLista.SubItems(2)
    Text1(5) = ItemLista.SubItems(3)
    Text1(6) = ItemLista.SubItems(4)
    Text1(7) = ItemLista.SubItems(5)
    Text1(8) = ItemLista.SubItems(6)
    Text1(9) = ItemLista.SubItems(7)
    ListChoferes.ListItems.Remove (ListChoferes.SelectedItem.Index)
    Eliminar.Enabled = True: Modificar.Enabled = True: Agregar.Enabled = False
End If
End Sub

Private Sub Modificar_Click()
On Error GoTo ERR_cmdCambiar:
Text1(2).SetFocus
Sql = "Select * from Choferes where CodFlet = " & Text1(0) & " AND CUIL = '" & Text1(4) & "'"
Set rsChoferes = db.OpenRecordset(Sql, 2)
rsChoferes.Edit
rsChoferes.LockEdits = True
Items = 2
For Items = Items + 1 To Text1.Count
    Text1(Items - 1).BackColor = &H80000005
Next
Accion = "Modificar"
Agregar.Enabled = True: Eliminar.Enabled = False
Modificar.Enabled = False
Exit Sub
ERR_cmdCambiar:
    TableError Err
End Sub

Private Sub Text1_LostFocus(Index As Integer)
If Index = 0 Then
    If Not Text1(0) = "" Then
        Criterio = "CodFlet = " & Text1(0)
        Sql = "SELECT * FROM Fleteros WHERE " & Criterio
        Set rsFleteros = db.OpenRecordset(Sql, 2)
        If Not rsFleteros.EOF And Not rsFleteros.BOF Then
           MostrarRegistro
        End If
    End If
End If
End Sub
Private Sub MostrarRegistro()
On Error Resume Next
Text1(0) = rsFleteros!codflet
Text1(1) = rsFleteros!DescFlet
 Sql = "SELECT * FROM Choferes WHERE CodFlet = " & Text1(0) & ""
            Set rsChoferes = db.OpenRecordset(Sql, 2)
            If Not rsChoferes.EOF And Not rsChoferes.BOF Then
            ListChoferes.ListItems.Clear
            Do While Not rsChoferes.EOF
                Set ItemLista = ListChoferes.ListItems.Add(, , rsChoferes!AyN)
                ItemLista.Tag = rsChoferes!AyN
                ItemLista.SubItems(1) = rsChoferes!Telefono
                ItemLista.SubItems(2) = rsChoferes!CUIL
                ItemLista.SubItems(3) = rsChoferes!Marca
                ItemLista.SubItems(4) = rsChoferes!Modelo
                ItemLista.SubItems(5) = rsChoferes!AÑO
                ItemLista.SubItems(6) = rsChoferes!PatChasis
                ItemLista.SubItems(7) = rsChoferes!PatAcop
                rsChoferes.MoveNext
            Loop
        End If
End Sub
