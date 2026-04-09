VERSION 5.00
Object = "{831FDD16-0C5C-11D2-A9FC-0000F8754DA1}#2.0#0"; "MSCOMCTL.OCX"
Object = "{C932BA88-4374-101B-A56C-00AA003668DC}#1.1#0"; "MSMASK32.OCX"
Object = "{D18BBD1F-82BB-4385-BED3-E9D31A3E361E}#1.0#0"; "kewlbuttonz.ocx"
Begin VB.Form ABMConCompras 
   BackColor       =   &H80000007&
   Caption         =   "ABM Conceptos Compras"
   ClientHeight    =   2340
   ClientLeft      =   60
   ClientTop       =   450
   ClientWidth     =   6180
   LinkTopic       =   "Form1"
   MDIChild        =   -1  'True
   ScaleHeight     =   2340
   ScaleWidth      =   6180
   Begin VB.TextBox Text1 
      BackColor       =   &H00FFFFFF&
      Height          =   285
      Index           =   0
      Left            =   1320
      TabIndex        =   0
      Text            =   "Text1"
      Top             =   840
      Width           =   4575
   End
   Begin VB.TextBox Text1 
      Height          =   285
      Index           =   1
      Left            =   2640
      TabIndex        =   2
      Text            =   "Text1"
      Top             =   1320
      Width           =   3255
   End
   Begin VB.CommandButton cmdMover 
      Caption         =   "<<"
      Height          =   435
      Index           =   0
      Left            =   2040
      TabIndex        =   10
      Top             =   1800
      Visible         =   0   'False
      Width           =   495
   End
   Begin VB.CommandButton cmdMover 
      Caption         =   "<"
      Height          =   435
      Index           =   1
      Left            =   2520
      TabIndex        =   9
      Top             =   1800
      Visible         =   0   'False
      Width           =   495
   End
   Begin VB.CommandButton cmdMover 
      Caption         =   ">"
      Height          =   435
      Index           =   2
      Left            =   3060
      TabIndex        =   8
      Top             =   1800
      Visible         =   0   'False
      Width           =   495
   End
   Begin VB.CommandButton cmdMover 
      Caption         =   ">>"
      Height          =   435
      Index           =   3
      Left            =   3540
      TabIndex        =   7
      Top             =   1800
      Visible         =   0   'False
      Width           =   495
   End
   Begin MSMask.MaskEdBox CtaCont 
      Height          =   285
      Left            =   1320
      TabIndex        =   1
      Top             =   1320
      Width           =   1215
      _ExtentX        =   2143
      _ExtentY        =   503
      _Version        =   393216
      PromptChar      =   "_"
   End
   Begin MSComctlLib.Toolbar Toolbar1 
      Align           =   1  'Align Top
      Height          =   630
      Left            =   0
      TabIndex        =   11
      Top             =   0
      Width           =   6180
      _ExtentX        =   10901
      _ExtentY        =   1111
      ButtonWidth     =   609
      ButtonHeight    =   953
      Appearance      =   1
      _Version        =   393216
      Begin KewlButtonz.KewlButtons Command1 
         Height          =   495
         Index           =   9
         Left            =   9840
         TabIndex        =   12
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
         MICON           =   "ABMConCompras.frx":0000
         PICN            =   "ABMConCompras.frx":001C
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
         Left            =   4680
         TabIndex        =   6
         Top             =   0
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
         MICON           =   "ABMConCompras.frx":209E
         PICN            =   "ABMConCompras.frx":20BA
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
         Left            =   3120
         TabIndex        =   3
         Top             =   0
         Width           =   1335
         _ExtentX        =   2355
         _ExtentY        =   873
         BTYPE           =   1
         TX              =   "Aceptar"
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
         MICON           =   "ABMConCompras.frx":2654
         PICN            =   "ABMConCompras.frx":2670
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
         Left            =   1680
         TabIndex        =   4
         Top             =   0
         Width           =   1215
         _ExtentX        =   2143
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
         MICON           =   "ABMConCompras.frx":46F2
         PICN            =   "ABMConCompras.frx":470E
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
         Height          =   495
         Left            =   120
         TabIndex        =   5
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
         MICON           =   "ABMConCompras.frx":6418
         PICN            =   "ABMConCompras.frx":6434
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
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Concepto"
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
      Left            =   120
      TabIndex        =   14
      Top             =   840
      Width           =   1455
   End
   Begin VB.Label Label1 
      BackColor       =   &H00000000&
      Caption         =   "Cuenta "
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
      Left            =   120
      TabIndex        =   13
      Top             =   1320
      Width           =   1455
   End
End
Attribute VB_Name = "ABMConCompras"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False

Private Sub MostrarRegistro()
On Error Resume Next
Text1(0) = rsConceptoCompras!descconcepto
CtaCont = rsConceptoCompras!CtaCont
Set rsPlanCtas = db.OpenRecordset("Select * from PlanCtas Where CodCta = '" & CtaCont & "'")
Text1(1) = rsPlanCtas!DescCta
Set rsPlanCtas = Nothing
End Sub
Private Sub Aceptar_Click()
On Error GoTo AltaProv
If Accion = "Nuevo" Then
    Set rsConceptoCompras = db.OpenRecordset("ConceptoCompras", 1, 1)
    lPrimaryKey = GetPrimaryKey
    With rsConceptoCompras
        .AddNew
        .Fields("CodConcepto") = lPrimaryKey
        .Fields("DescConcepto") = Text1(0)
        .Fields("CtaCont") = CtaCont
        .Update
    End With
    Set rsConceptoCompras = Nothing
    Text1(0) = "": Text1(1) = ""
    CtaCont.Mask = "": CtaCont.Text = "": CtaCont.Mask = "#.#.#.##.###"
    MsgBox "Concepto Agregada Correctamente", vbInformation
    Text1(0).SetFocus
Exit Sub
AltaProv:
    TableError Err
    Set rsConceptoCompras = Nothing
End If
If Accion = "Buscar" Then
    Set rsConceptoCompras = db.OpenRecordset("Select * from ConceptoCompras Where DescConcepto Like '*" & Text1(0) & "*'")
    If Not rsConceptoCompras.EOF And Not rsConceptoCompras.BOF Then
        Call MostrarRegistro
        Modificar.Enabled = True
        Buscar.Enabled = False
    Else
        MsgBox "No hay Coincidencias", vbInformation
    End If
    Items = 0
    For Items = Items + 1 To cmdMover.Count
        cmdMover(Items - 1).Visible = True
    Next
End If
If Accion = "Modificar" Then
    rsConceptoCompras.Fields("DescConcepto") = Text1(0)
    rsConceptoCompras.Fields("CtaCont") = CtaCont
    rsConceptoCompras.Update
    rsConceptoCompras.LockEdits = False
    Set rsConceptoCompras = Nothing
    Text1(0) = "": Text1(1) = ""
    CtaCont.Mask = "": CtaCont.Text = "": CtaCont.Mask = "#.#.#.##.###"
    MsgBox "Concepto Modificado Correctamente", vbInformation
    Text1(0).SetFocus
    Modificar.Enabled = False: Buscar.Enabled = True
    Items = 0
    For Items = Items + 1 To cmdMover.Count
        cmdMover(Items - 1).Visible = False
    Next
    Accion = "Nuevo"
End If

End Sub
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

Private Sub Buscar_Click()
Text1(0).BackColor = &H80FF&: Text1(1).BackColor = &H80FF&
CtaCont.BackColor = &H80FF&
Accion = "Buscar"
Text1(0).SetFocus
End Sub

Private Sub Cancelar_Click()
Call Form_Load
End Sub

Private Sub cmdMover_Click(Index As Integer)
 ' se definen las constantes para indicar el tipo de navegación
    ' cada constante se corresponde con un índice de la matriz de
    ' controles
    Const MOVE_FIRST = 0
    Const MOVE_PREVIOUS = 1
    Const MOVE_NEXT = 2
    Const MOVE_LAST = 3
    With rsConceptoCompras
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
On Error Resume Next
If Not CtaCont = "" Then
    Set rsPlanCtas = db.OpenRecordset("Select * From PlanCtas Where CodCta = '" & CtaCont & "'")
    If Not rsPlanCtas.EOF And Not rsPlanCtas.BOF Then
        Text1(1) = rsPlanCtas!DescCta
    Else
        MsgBox "La Cuenta no existe"
    End If
Else
    MsgBox "Campo Obligatorio"
End If
Set rsPlanCtas = Nothing
End Sub

Private Sub Form_Load()
On Error Resume Next
Text1(0) = "": Text1(1) = ""
CtaCont.Mask = "": CtaCont.Text = "": CtaCont.Mask = "#.#.#.##.###"
Text1(0).BackColor = &HFFFFFF: Text1(1).BackColor = &HFFFFFF
CtaCont.BackColor = &HFFFFFF
Accion = "Nuevo"
End Sub
Private Function GetPrimaryKey()
    ' Devuelve una clave única basada en el número de cliente
    With rsConceptoCompras
    
        ' Si en la tabla ya hay registros, encuentra el último
        ' número de cliente y le suma uno para obtener una clave
        ' que sea única; si no hubiese registros, asigna el valor 1
        
        If (Not (.EOF And .BOF)) Then
            
            .MoveLast
            
            GetPrimaryKey = .Fields("CodConcepto") + 1
            
        Else
            
            GetPrimaryKey = 1
        
        End If
        
    End With
End Function

Private Sub Modificar_Click()
Text1(0).BackColor = &HFFFFFF: Text1(1).BackColor = &HFFFFFF
CtaCont.BackColor = &HFFFFFF
Accion = "Modificar"
Text1(0).SetFocus
rsConceptoCompras.Edit
rsConceptoCompras.LockEdits = True
End Sub


