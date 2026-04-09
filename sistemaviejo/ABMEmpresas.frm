VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form ABMEmpresas 
   BackColor       =   &H00000000&
   Caption         =   "ABM de Empresas"
   ClientHeight    =   4020
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   9885
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   4020
   ScaleWidth      =   9885
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   7
      Left            =   3840
      TabIndex        =   17
      Text            =   "Text1"
      Top             =   3000
      Width           =   4455
   End
   Begin MSMask.MaskEdBox CtaCont 
      Height          =   255
      Left            =   2520
      TabIndex        =   16
      Top             =   3000
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   450
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin VB.CommandButton cmdMover 
      Caption         =   "<<"
      Height          =   435
      Index           =   0
      Left            =   3840
      TabIndex        =   28
      Top             =   3480
      Width           =   495
   End
   Begin VB.CommandButton cmdMover 
      Caption         =   "<"
      Height          =   435
      Index           =   1
      Left            =   4320
      TabIndex        =   27
      Top             =   3480
      Width           =   495
   End
   Begin VB.CommandButton cmdMover 
      Caption         =   ">"
      Height          =   435
      Index           =   2
      Left            =   4860
      TabIndex        =   26
      Top             =   3480
      Width           =   495
   End
   Begin VB.CommandButton cmdMover 
      Caption         =   ">>"
      Height          =   435
      Index           =   3
      Left            =   5340
      TabIndex        =   25
      Top             =   3480
      Width           =   495
   End
   Begin VB.ComboBox Combo1 
      Height          =   315
      Left            =   5640
      TabIndex        =   15
      Text            =   "Combo1"
      Top             =   2640
      Width           =   2655
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   6
      Left            =   2520
      TabIndex        =   14
      Text            =   "Text1"
      Top             =   2640
      Width           =   1695
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   5
      Left            =   2520
      TabIndex        =   13
      Text            =   "Text1"
      Top             =   2280
      Width           =   5775
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   4
      Left            =   2520
      TabIndex        =   12
      Text            =   "Text1"
      Top             =   1920
      Width           =   5775
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   3
      Left            =   4680
      TabIndex        =   11
      Text            =   "Text1"
      Top             =   1560
      Width           =   3615
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   2
      Left            =   2520
      TabIndex        =   10
      Text            =   "Text1"
      Top             =   1560
      Width           =   1095
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2520
      TabIndex        =   9
      Text            =   "Text1"
      Top             =   1200
      Width           =   5775
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   0
      Left            =   2520
      TabIndex        =   8
      Text            =   "Text1"
      Top             =   840
      Width           =   5775
   End
   Begin MSComctlLib.Toolbar Toolbar1 
      Align           =   1  'Align Top
      Height          =   630
      Left            =   0
      TabIndex        =   18
      Top             =   0
      Width           =   9885
      _ExtentX        =   17436
      _ExtentY        =   1111
      ButtonWidth     =   609
      ButtonHeight    =   953
      Appearance      =   1
      _Version        =   393216
      Begin KewlButtonz.KewlButtons Modificar 
         Height          =   495
         Left            =   2640
         TabIndex        =   24
         Top             =   0
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
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
         MICON           =   "ABMEmpresas.frx":0000
         PICN            =   "ABMEmpresas.frx":001C
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
         Height          =   495
         Left            =   600
         TabIndex        =   23
         Top             =   0
         Width           =   1455
         _ExtentX        =   2566
         _ExtentY        =   873
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
         MICON           =   "ABMEmpresas.frx":562E
         PICN            =   "ABMEmpresas.frx":564A
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Buscar 
         Height          =   495
         Left            =   4440
         TabIndex        =   22
         Top             =   0
         Width           =   1815
         _ExtentX        =   3201
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
         FCOLO           =   16777215
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMEmpresas.frx":5BE4
         PICN            =   "ABMEmpresas.frx":5C00
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Aceptar 
         Height          =   495
         Left            =   6600
         TabIndex        =   21
         Top             =   0
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Aceptar"
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
         MICON           =   "ABMEmpresas.frx":790A
         PICN            =   "ABMEmpresas.frx":7926
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
         Left            =   8280
         TabIndex        =   20
         Top             =   0
         Width           =   1215
         _ExtentX        =   2143
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Cancelar"
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
         FCOL            =   12632256
         FCOLO           =   4210752
         MCOL            =   4210752
         MPTR            =   1
         MICON           =   "ABMEmpresas.frx":99A8
         PICN            =   "ABMEmpresas.frx":99C4
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
      Begin KewlButtonz.KewlButtons Command1 
         Height          =   495
         Index           =   9
         Left            =   9840
         TabIndex        =   19
         Top             =   2880
         Width           =   1095
         _ExtentX        =   1931
         _ExtentY        =   873
         BTYPE           =   8
         TX              =   "Salir"
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
         MICON           =   "ABMEmpresas.frx":9F5E
         PICN            =   "ABMEmpresas.frx":9F7A
         UMCOL           =   -1  'True
         SOFT            =   0   'False
         PICPOS          =   0
         NGREY           =   0   'False
         FX              =   1
         HAND            =   0   'False
         CHECK           =   0   'False
         VALUE           =   0   'False
      End
   End
   Begin VB.Label Label7 
      BackColor       =   &H00000000&
      Caption         =   "Cuenta"
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
      Height          =   375
      Left            =   1080
      TabIndex        =   29
      Top             =   3000
      Width           =   975
   End
   Begin VB.Label Label3 
      BackColor       =   &H00000000&
      Caption         =   "Código Postal"
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
      Left            =   1080
      TabIndex        =   7
      Top             =   1560
      Width           =   1455
   End
   Begin VB.Label Label4 
      BackColor       =   &H00000000&
      Caption         =   "Localidad"
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
      Left            =   3720
      TabIndex        =   6
      Top             =   1560
      Width           =   1455
   End
   Begin VB.Label Label5 
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
      Left            =   1080
      TabIndex        =   5
      Top             =   1920
      Width           =   1455
   End
   Begin VB.Label Label6 
      BackColor       =   &H00000000&
      Caption         =   "Email"
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
      Left            =   1080
      TabIndex        =   4
      Top             =   2280
      Width           =   1455
   End
   Begin VB.Label Label8 
      BackColor       =   &H00000000&
      Caption         =   "Condición IVA"
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
      Left            =   4320
      TabIndex        =   3
      Top             =   2640
      Width           =   1455
   End
   Begin VB.Label Label9 
      BackColor       =   &H00000000&
      Caption         =   "CUIT"
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
      Left            =   1080
      TabIndex        =   2
      Top             =   2640
      Width           =   975
   End
   Begin VB.Label Label2 
      BackColor       =   &H00000000&
      Caption         =   "Dirección"
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
      Left            =   1080
      TabIndex        =   1
      Top             =   1200
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Razón Social"
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
      Left            =   1080
      TabIndex        =   0
      Top             =   840
      Width           =   1455
   End
End
Attribute VB_Name = "ABMEmpresas"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsEmpresas
    
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("CodEmpresas") + 1
            
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

Private Sub Aceptar_Click()
If Accion = "Nuevo" Then
On Error GoTo ERR_cmdAltaRegistro:
    Dim nAccessValue As Integer
    Set rsEmpresas = db.OpenRecordset("Select * from Empresas Where CUIT = '" & Text1(6) & "'")
    If Not rsEmpresas.EOF And Not rsEmpresas.BOF Then
        MsgBox "La Empresa ya fue cargado con el Codigo: " & rsEmpresas!codEmpresas
        Screen.MousePointer = vbDefault
        Exit Sub
    End If
    Screen.MousePointer = vbHourglass
    nAccessValue = 0
    ' aplica los permisos deseados por el usuario
    'nAccessValue = nAccessValue + dbDenyWrite
    Set rsEmpresas = db.OpenRecordset("sELECT * FROM Empresas orDER BY cODeMPRESAS")
    DBEngine.Idle dbRefreshCache

    
    Dim lPrimaryKey As Long
    Dim sMessage As String
    ' recupera una clave única desde la rutina GetPrimaryKey
    lPrimaryKey = GetPrimaryKey
        With rsEmpresas
            .AddNew
            .Fields("CodEmpresas") = lPrimaryKey
            .Fields("DescEmpresas") = Text1(0)
            .Fields("Direccion") = Text1(1)
            .Fields("Telefono") = Text1(4)
            .Fields("EMail") = Text1(5)
            .Fields("CUIT") = Text1(6)
            .Fields("CP") = Text1(2)
            .Fields("Localidad") = Text1(3)
            .Fields("CodIVA") = Combo1.ListIndex + 1
            .Fields("CtaContable") = CtaCont
            .Update
        End With
        Set rsEmpresas = Nothing
        Combo1.ListIndex = 0
        Items = 0
        For Items = Items + 1 To Text1.Count
            Text1(Items - 1) = ""
        Next
        CtaCont.Mask = ""
        CtaCont.Text = ""
        CtaCont.Mask = "#.#.#.##.###"
        Aceptar.Enabled = True: Cancelar.Enabled = True: Buscar.Enabled = True: Eliminar.Enabled = False
        Accion = "Nuevo"
        ' Si el código pasa por aquí es porque todo ha ido bien
        sMessage = "La Empresa fue agregado exitosamente con el Codigo:   " & lPrimaryKey
        MsgBox sMessage, vbInformation, "Alta Fletero"
        Screen.MousePointer = vbDefault
        Exit Sub
ERR_cmdAltaRegistro:
    TableError Err
    Set rsEmpresas = Nothing
    Screen.MousePointer = vbDefault
End If
If Accion = "Buscar" Then
On Error GoTo ERR_cmdBuscar:
     Screen.MousePointer = vbHourglass
     Items = 0: Criterio = ""
     For Items = Items + 1 To Text1.Count
        If Not Text1(Items - 1).Text = "" Then
            If Not Criterio = "" Then
                Criterio = Criterio & " AND "
            End If
            Select Case Text1(Items - 1).Index
                Case 0: Criterio = Criterio & "DescEmpresas Like '*" & Text1(0) & "*'"
                Case 1: Criterio = Criterio & "Direccion LIKE '*" & Text1(1) & "*'"
                Case 2: Criterio = Criterio & "CP LIKE '*" & Text1(2) & "*'"
                Case 3: Criterio = Criterio & "Localidad LIKE '*" & Text1(3) & "*'"
                Case 4: Criterio = Criterio & "Telefono LIKE '*" & Text1(4) & "*'"
                Case 5: Criterio = Criterio & "Email LIKE '*" & Text1(5) & "*'"
                Case 6: Criterio = Criterio & "CUIT LIKE '*" & Text1(6) & "*'"
            End Select
        End If
    Next
    If Not Criterio = "" Then
        Sql = "SELECT * FROM Empresas WHERE " & Criterio & ""
    Else
        Sql = "SELECT * FROM Empresas"
    End If
    Set rsEmpresas = db.OpenRecordset(Sql)
    Call MostrarRegistro
    Modificar.Enabled = True: Aceptar.Enabled = False
    Screen.MousePointer = vbDefault
    Exit Sub
ERR_cmdBuscar:
    TableError Err
    Set rsEmpresas = Nothing
    Screen.MousePointer = vbDefault
End If
If Accion = "Modificar" Then
On Error GoTo ERR_cmdModificar
    Screen.MousePointer = vbHourglass
    With rsEmpresas
        .Fields("DescEmpresas") = Text1(0)
        .Fields("Direccion") = Text1(1)
        .Fields("CP") = Text1(2)
        .Fields("Localidad") = Text1(3)
        .Fields("Telefono") = Text1(4)
        .Fields("Email") = Text1(5)
        .Fields("CUIT") = Text1(6)
        .Fields("CodIVA") = Combo1.ListIndex + 1
        .Fields("CtaContable") = CtaCont
        .Update
        .LockEdits = False
    End With
    MsgBox "La Empresa ha sido Modificado Exitosamente", vbInformation, "Modificar Registro"
    Items = 0
    For Items = Items + 1 To Text1.Count
        Text1(Items - 1).BackColor = &HFFFFFF
        Text1(Items - 1) = ""
    Next
    Combo1.BackColor = &HFFFFFF
    Combo1.ListIndex = 0
    Accion = "Nuevo"
    Items = 0
        For Items = Items + 1 To cmdMover.Count
             cmdMover(Items - 1).Visible = False
        Next
    CtaCont.Mask = ""
    CtaCont.Text = ""
    CtaCont.Mask = "#.#.#.##.###"
    Eliminar.Enabled = False: Buscar.Enabled = True: Aceptar.Enabled = True: Cancelar.Enabled = True
    Set rsEmpresas = Nothing
    Screen.MousePointer = vbDefault
    Exit Sub
ERR_cmdModificar:
    TableError Err
    Set rsEmpresas = Nothing
End If
        
End Sub
Private Sub MostrarRegistro()
With rsEmpresas
    If (Not (.EOF And .BOF)) Then
        Text1(0) = rsEmpresas!DescEmpresas
        Text1(1) = rsEmpresas!Direccion
        Text1(2) = rsEmpresas!CP
        Text1(3) = rsEmpresas!Localidad
        Text1(4) = rsEmpresas!Telefono
        Text1(5) = rsEmpresas!Email
        Text1(6) = rsEmpresas!cuit
        Combo1.ListIndex = rsEmpresas!CodIVA - 1
        CtaCont = rsEmpresas!CtaContable
        Set rsPlanCtas = db.OpenRecordset("SELECT * FROM PlanCtas WHERE CodCta = '" & rsEmpresas!CtaContable & "'")
        Text1(7) = rsPlanCtas!DescCta
        Set rsPlanCtas = Nothing
        Items = 0
        For Items = Items + 1 To cmdMover.Count
             cmdMover(Items - 1).Visible = True
        Next
    Else
        MsgBox "No hay Coincidencias", vbInformation
        Set rsEmpresas = Nothing
    End If
End With
End Sub
Private Sub Buscar_Click()
Items = 0
For Items = Items + 1 To Text1.Count
    Text1(Items - 1).BackColor = &H40C0&
Next
Combo1.BackColor = &H40C0&
CtaCont.BackColor = &H40C0&
Eliminar.Enabled = False: Modificar.Enabled = False: Buscar.Enabled = False: Aceptar.Enabled = True: Cancelar.Enabled = True
Accion = "Buscar"
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
    With rsEmpresas
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

Private Sub CtaCont_LostFocus()
Set rsPlanCtas = db.OpenRecordset("Select * From PlanCtas Where CodCta = '" & CtaCont & "'")
If Not rsPlanCtas.EOF And Not rsPlanCtas.BOF Then
    If rsPlanCtas!Imputable = "SI" Then
        Text1(7) = rsPlanCtas!DescCta
    Else
        MsgBox "La Cta no es Imputable"
        CtaCont.SetFocus
    End If
Else
    MsgBox "La cuenta no existe"
    CtaCont.SetFocus
End If
Set rsPlanCtas = Nothing
End Sub

Private Sub Form_Initialize()
Set rsSituacionIVA = Nothing
Set rsEmpresas = Nothing
Set rsPlanCtas = Nothing
End Sub

Private Sub Form_Load()
On Error Resume Next
Set rsSituacionIVA = db.OpenRecordset("SituacionIVA", 2)
Combo1.Clear
Do While Not rsSituacionIVA.EOF
    Combo1.AddItem rsSituacionIVA!Descripcion
    rsSituacionIVA.MoveNext
Loop
Combo1.ListIndex = 0
Combo1.BackColor = &H80000005
Items = 0
For Items = Items + 1 To Text1.Count
    Text1(Items - 1) = ""
    Text1(Items - 1).BackColor = &H80000005
Next
Items = 0
For Items = Items + 1 To cmdMover.Count
    cmdMover(Items - 1).Visible = False
Next
CtaCont.Mask = ""
CtaCont.Text = ""
CtaCont.Mask = "#.#.#.##.###"
Aceptar.Enabled = True: Cancelar.Enabled = True: Buscar.Enabled = True: Eliminar.Enabled = False: Modificar.Enabled = False
Accion = "Nuevo"
End Sub

Private Sub Modificar_Click()
On Error GoTo ERR_cmdCambiar:
Items = 0
For Items = Items + 1 To Text1.Count
    Text1(Items - 1).BackColor = &HFFFFFF
Next
Combo1.BackColor = &HFFFFFF
CtaCont.BackColor = &HFFFFFF
Eliminar.Enabled = False: Modificar.Enabled = False: Buscar.Enabled = False: Aceptar.Enabled = True: Cancelar.Enabled = True
rsEmpresas.Edit
rsEmpresas.LockEdits = True
Accion = "Modificar"
Exit Sub
ERR_cmdCambiar:
    TableError Err
    Items = 0
    For Items = Items + 1 To Text1.Count
        Text1(Items - 1).BackColor = &H40C0&
    Next
    Combo1.BackColor = &H40C0&
    Eliminar.Enabled = False: Modificar.Enabled = True: Buscar.Enabled = False: Aceptar.Enabled = True: Cancelar.Enabled = True
End Sub


